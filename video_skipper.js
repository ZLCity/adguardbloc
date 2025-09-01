// ===========================================================================
// ФАЙЛ: video_skipper.js (НОВИЙ!)
// ОПИС: Це спеціалізований скрипт для активного втручання в роботу
// відеоплеєра YouTube. Він впроваджується фоновим скриптом.
// Його завдання — знаходити та миттєво пропускати/прискорювати рекламу.
// ===========================================================================

console.log('Video Viper: Скрипт активовано!');

// Створюємо інтервал, який буде постійно перевіряти наявність реклами
const viperInterval = setInterval(() => {
    // --- Крок 1: Знаходимо плеєр і відео ---
    const videoPlayer = document.querySelector('.html5-main-video');
    if (!videoPlayer) return; // Якщо плеєра немає, нічого не робимо

    const adContainer = document.querySelector('.video-ads.ytp-ad-module');
    const isAdShowing = adContainer ? adContainer.children.length > 0 : false;

    // --- Крок 2: Перевіряємо, чи показується реклама ---
    if (isAdShowing) {
        // --- Крок 3: Намагаємося натиснути кнопку "Пропустити" ---
        const skipButtonModern = document.querySelector('.ytp-ad-skip-button-modern');
        const skipButton = document.querySelector('.ytp-ad-skip-button');

        if (skipButtonModern) {
            skipButtonModern.click();
            console.log('Video Viper: Натиснуто modern кнопку пропуску!');
        } else if (skipButton) {
            skipButton.click();
            console.log('Video Viper: Натиснуто звичайну кнопку пропуску!');
        }

        // --- Крок 4: Якщо пропустити не можна, прискорюємо відео та вимикаємо звук ---
        // Ми робимо це завжди, коли є реклама, на випадок, якщо кнопка ще не з'явилась
        if (videoPlayer.playbackRate !== 16) {
            videoPlayer.playbackRate = 16;
            console.log('Video Viper: Рекламу прискорено!');
        }
        if (!videoPlayer.muted) {
            videoPlayer.muted = true;
            console.log('Video Viper: Звук реклами вимкнено!');
        }

        // Додатково ховаємо банери, які можуть з'явитись
        const adOverlay = document.querySelector('.ytp-ad-overlay-container');
        if (adOverlay) adOverlay.style.visibility = 'hidden';

    } else {
        // --- Крок 5: Якщо реклами немає, повертаємо нормальні налаштування ---
        if (videoPlayer.playbackRate !== 1) {
            videoPlayer.playbackRate = 1;
        }
        if (videoPlayer.muted) {
            // Повертаємо звук, тільки якщо він був вимкнений саме скриптом
            // Це проста перевірка, яка може бути вдосконалена
            videoPlayer.muted = false;
        }

        const adOverlay = document.querySelector('.ytp-ad-overlay-container');
        if (adOverlay && adOverlay.style.visibility === 'hidden') {
            adOverlay.style.visibility = 'visible';
        }
    }
}, 300); // Перевіряємо кожні 300 мілісекунд - цього достатньо
