// ===========================================================================
// ФАЙЛ: popup.js (Версія 7.0)
// ОПИС: Без змін у логіці. Інтерфейс стабільний.
// ===========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const pageCountElement = document.getElementById('page-count');
    const totalCountElement = document.getElementById('total-count');
    const siteUrlElement = document.getElementById('site-url');
    const powerButton = document.getElementById('power-button');
    let currentTabUrl = '';

    const animateCount = (element, finalCount) => {
        let start = parseInt(element.textContent.replace(/,/g, '')) || 0;
        const duration = 400;
        const stepTime = 15;
        const steps = duration / stepTime;
        const increment = (finalCount - start) / steps;
        const timer = setInterval(() => {
            start += increment;
            if ((increment > 0 && start >= finalCount) || (increment < 0 && start <= finalCount)) {
                clearInterval(timer);
                start = finalCount;
            }
            element.textContent = Math.floor(start).toLocaleString();
        }, stepTime);
    };

    const updateUI = (isEnabled) => {
        powerButton.className = 'power-button ' + (isEnabled ? 'enabled' : 'disabled');
        powerButton.title = isEnabled ? 'Вимкнути захист на цьому сайті' : 'Увімкнути захист на цьому сайті';
    };

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].url || !tabs[0].url.startsWith('http')) {
            siteUrlElement.textContent = 'Службова сторінка';
            powerButton.disabled = true;
            updateUI(false);
            return;
        }
        currentTabUrl = tabs[0].url;
        siteUrlElement.textContent = new URL(currentTabUrl).hostname;
        chrome.runtime.sendMessage({ type: 'GET_SITE_STATUS', url: currentTabUrl }, (response) => {
            if (chrome.runtime.lastError) return;
            updateUI(response.isEnabled);
        });
    });

    powerButton.addEventListener('click', () => {
        if (!currentTabUrl || powerButton.disabled) return;
        powerButton.disabled = true;
        chrome.runtime.sendMessage({ type: 'TOGGLE_WHITELIST', url: currentTabUrl }, (response) => {
             if (chrome.runtime.lastError) { powerButton.disabled = false; return; }
            updateUI(response.isEnabled);
            powerButton.disabled = false;
        });
    });

    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response) {
            animateCount(pageCountElement, response.onPage);
            animateCount(totalCountElement, response.total);
        }
    });
});
