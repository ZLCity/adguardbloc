// ===========================================================================
// ФАЙЛ: background.js (Версія 7.0 "Video Viper")
// ОПИС: Мозок розширення. Тепер він не тільки керує правилами,
// а й активно впроваджує спеціалізований скрипт на сторінки з відео
// для боротьби з рекламою в плеєрах.
// ===========================================================================

// --- Розділ 1: Конфігурація та ініціалізація (без змін) ---

const FILTER_LISTS = [
    { name: 'EasyList', url: 'https://easylist.to/easylist/easylist.txt' },
    { name: 'AdGuard Annoyances', url: 'https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_14_Annoyances/filter.txt' }
];
const UPDATE_ALARM_NAME = 'update_filter_lists_alarm_v7';
let blockedStats = { total: 0, byTab: {} };

chrome.storage.local.get(['blockedStats'], (result) => {
  if (result.blockedStats) blockedStats = result.blockedStats;
});

// --- Розділ 2: Керування правилами блокування (без змін) ---

function parseFilterRule(line, id) {
  if (!line || line.startsWith('!') || line.startsWith('#') || line.includes('##')) return null;
  let urlFilter = line.replace(/^\|\|/, '').replace(/\^$/, '');
  if (urlFilter.startsWith('.')) urlFilter = '*' + urlFilter;
  if (!urlFilter.includes('.')) return null;
  return {
    id: id, priority: 1, action: { type: 'block' },
    condition: {
      urlFilter: `||${urlFilter}`,
      resourceTypes: [
        'main_frame', 'sub_frame', 'script', 'image', 'xmlhttprequest',
        'ping', 'media', 'websocket', 'stylesheet', 'other'
      ]
    }
  };
}

async function updateFilterLists() {
  console.log('Починаємо оновлення списків фільтрів...');
  const allNewRules = [];
  let idCounter = 1;
  for (const filterList of FILTER_LISTS) {
    try {
      const response = await fetch(filterList.url);
      if (!response.ok) continue;
      const text = await response.text();
      const lines = text.split('\n');
      for (const line of lines) {
        const rule = parseFilterRule(line, idCounter);
        if (rule) {
          allNewRules.push(rule);
          idCounter++;
        }
      }
    } catch (error) {
      console.error(`Помилка під час завантаження "${filterList.name}":`, error);
    }
  }
  if (allNewRules.length > 0) {
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const currentRuleIds = currentRules.map(rule => rule.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: currentRuleIds,
      addRules: allNewRules
    });
    console.log(`Оновлення завершено. Всього додано ${allNewRules.length} правил.`);
  }
}

chrome.alarms.create(UPDATE_ALARM_NAME, { periodInMinutes: 24 * 60 });
chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === UPDATE_ALARM_NAME) updateFilterLists(); });
chrome.runtime.onInstalled.addListener(() => { updateFilterLists(); });

// --- Розділ 3: Логіка білого списку (без змін) ---

async function getWhitelist() {
  const data = await chrome.storage.local.get('whitelist');
  return data.whitelist || [];
}
async function isSiteWhitelisted(url) {
  if (!url) return false;
  const domain = new URL(url).hostname;
  const whitelist = await getWhitelist();
  return whitelist.includes(domain);
}
async function updateTabBlocking(tabId, isEnabled) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (enabled) => window.postMessage({ type: 'ADGUARD_ULTIMATE_PRO_STATUS', enabled }, '*'),
      args: [isEnabled]
    });
  } catch (e) { /* Ігноруємо помилки на службових сторінках */ }
}

// --- Розділ 4: Обробка повідомлень та подій (модифіковано) ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    if (request.type === 'GET_SITE_STATUS') {
      const whitelisted = await isSiteWhitelisted(request.url);
      sendResponse({ isEnabled: !whitelisted });
    } else if (request.type === 'TOGGLE_WHITELIST') {
      const domain = new URL(request.url).hostname;
      let whitelist = await getWhitelist();
      const isCurrentlyWhitelisted = whitelist.includes(domain);
      if (isCurrentlyWhitelisted) {
        whitelist = whitelist.filter(d => d !== domain);
      } else {
        whitelist.push(domain);
      }
      await chrome.storage.local.set({ whitelist });
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) await updateTabBlocking(tab.id, isCurrentlyWhitelisted);
      sendResponse({ isEnabled: isCurrentlyWhitelisted });
    } else if (request.type === 'ELEMENT_BLOCKED') {
      const tabId = sender.tab?.id;
      if (tabId) {
        blockedStats.total += request.count;
        blockedStats.byTab[tabId] = (blockedStats.byTab[tabId] || 0) + request.count;
        chrome.storage.local.set({ blockedStats });
        chrome.action.setBadgeText({ text: String(blockedStats.byTab[tabId]), tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#e74c3c' });
      }
    } else if (request.type === 'GET_STATS') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const onPage = tab ? (blockedStats.byTab[tab.id] || 0) : 0;
      sendResponse({ onPage, total: blockedStats.total || 0 });
    }
  })();
  return true;
});

chrome.tabs.onRemoved.addListener(tabId => { delete blockedStats.byTab[tabId]; });

// --- НОВИЙ РОЗДІЛ 5: ВПРОВАДЖЕННЯ VIDEO VIPER ---

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Скидання лічильника
  if (changeInfo.status === 'loading') {
    blockedStats.byTab[tabId] = 0;
    chrome.action.setBadgeText({ text: '', tabId });
    if (tab.url && tab.url.startsWith('http')) {
      const whitelisted = await isSiteWhitelisted(tab.url);
      await updateTabBlocking(tabId, !whitelisted);
    }
  }

  // Впровадження скрипта для відео
  // Перевіряємо, чи сторінка повністю завантажилась і чи це YouTube
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
     const whitelisted = await isSiteWhitelisted(tab.url);
     if (!whitelisted) {
        console.log('Video Viper: Впроваджуємо скрипт на сторінку YouTube...');
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['video_skipper.js']
        });
     }
  }
});
