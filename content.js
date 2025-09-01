// ===========================================================================
// ФАЙЛ: content.js (Версія 7.0)
// ОПИС: Основний скрипт для косметичного блокування. Його селектори
// були посилені для кращого приховування залишків реклами.
// Активне блокування відео тепер виконує `video_skipper.js`.
// ===========================================================================

let isBlockingEnabled = true;

const AD_SELECTORS = [
    // --- Загальна реклама ---
    '.ad', '.ads', '.advert', '.advertisement', '.banner-ad', '.google-ad', 'div[class*="ad-"]',
    '[id^="ad_"]', '[id*="_ad_"]', '[id$="_ad"]', '[class^="ad-"]', '[class*=" ad-"]',
    '[data-ad-format]', 'ins.adsbygoogle', 'div[data-ad-name]', 'div[aria-label="advertisement"]',
    'div[data-ad-unit]', 'div[data-ad-slot]', '[id*="google_ads_"]', 'ytm-promoted-sparkles-renderer',

    // --- Реклама у відео (візуальні контейнери) ---
    '.video-ads', '.ytp-ad-module', '.ytp-ad-overlay-container',
    '.ytd-promoted-video-renderer', '.ytd-display-ad-renderer', '.ytd-promoted-sparkles-web-renderer',
    '#player-ads', '.ytp-ad-text', 'div#player-ads', 'ytd-ad-slot-renderer',

    // --- Соціальні мережі та контентні мережі ---
    '[data-testid="placementTracking"]', '.promoted-tweet', '.trc_rbox_div', '.OUTBRAIN',

    // --- Набридливі елементи ---
    '.cookie-notice', '#cookie-banner', '.cookie-consent', 'div[id*="cookie"]', '#onesignal-slidedown-container',
    '.sidebar-ad', '.header-ad', '.footer-ad', 'div[id*="sticky-ad"]', 'div[class*="popup"]'
];

const SELECTOR_STRING = AD_SELECTORS.join(', ');

function hideAdElements() {
    if (!isBlockingEnabled) return;
    let newlyHiddenCount = 0;
    try {
        const elements = document.querySelectorAll(SELECTOR_STRING);
        elements.forEach(element => {
            if (element.style.display !== 'none') {
                element.style.setProperty('display', 'none', 'important');
                element.style.setProperty('visibility', 'hidden', 'important');
                newlyHiddenCount++;
            }
        });
        if (newlyHiddenCount > 0) {
            chrome.runtime.sendMessage({ type: 'ELEMENT_BLOCKED', count: newlyHiddenCount });
        }
    } catch(e) { /* Ігноруємо помилки */ }
}

function unhideAllElements() {
     try {
        const elements = document.querySelectorAll(SELECTOR_STRING);
        elements.forEach(element => {
            if (element.style.display === 'none') {
                element.style.display = '';
                element.style.visibility = '';
            }
        });
    } catch(e) { /* Ігноруємо помилки */ }
}

const observer = new MutationObserver(() => {
    if (isBlockingEnabled) hideAdElements();
});

observer.observe(document.documentElement, { childList: true, subtree: true });

hideAdElements();

window.addEventListener('message', (event) => {
    if (event.source === window && event.data.type === 'ADGUARD_ULTIMATE_PRO_STATUS') {
        const wasEnabled = isBlockingEnabled;
        isBlockingEnabled = event.data.enabled;
        if (wasEnabled !== isBlockingEnabled) {
            console.log(`AdGuard: Блокування ${isBlockingEnabled ? 'УВІМКНЕНО' : 'ВИМКНЕНО'}`);
            if (isBlockingEnabled) hideAdElements();
            else unhideAllElements();
        }
    }
});
