import { firebaseConfig } from './firebase-config.js';
// Note: In a real app, these would be imported from the Firebase SDK NPM package.
// For this browser-based setup, we assume the SDKs are loaded via script tags in index.html.
// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
// import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- Firebase Initialization (using global firebase object from scripts) ---
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- DOM Elements ---
const playerHudContainer = document.getElementById('players-hud-container');
const playerHandContainer = document.getElementById('player-hand');
const doorDeckElement = document.getElementById('door-deck');
const logList = document.getElementById('log-list');
const endTurnBtn = document.getElementById('end-turn-btn');

// --- Game State (now driven by Firestore) ---
let game; // This will hold the game state from Firestore
let localPlayerId = 'player1'; // This would be set by Firebase Auth
const GAME_SESSION_ID = 'game_xyz789'; // A fixed ID for this example

// --- Firestore Real-time Listener ---

// This is the core of the real-time functionality.
// It listens for any changes to our game session document in Firestore.
// Whenever the document is updated, this function runs and updates the UI.
const gameSessionRef = db.collection('game_sessions').doc(GAME_SESSION_ID);
const unsubscribe = gameSessionRef.onSnapshot(doc => {
    if (doc.exists) {
        game = doc.data(); // Update our local game state with the data from Firestore
        console.log("Received game state update:", game);
        addLog("Стан гри оновлено з сервера.");
        renderFullUI();
    } else {
        console.log("No such document!");
        addLog("Помилка: не вдалося знайти ігрову сесію.");
        // Here you might show a "Create Game" button.
    }
}, err => {
    console.log(`Encountered error: ${err}`);
    addLog("Помилка підключення до сервера.");
});


// --- Player Actions (now send requests to the server) ---

function handleDrawDoor() {
    // Instead of changing the game state directly, we now "ask" the server to do it.
    // In a real app, this would call a Cloud Function.
    console.log(`Client requests action: 'DRAW_DOOR' for player: ${localPlayerId}`);
    addLog("Запит на взяття карти дверей відправлено на сервер...");
    // Since we don't have a Cloud Function yet, we can't do anything else here.
    // The UI will only update when Firestore changes.
}

function handleEndTurn() {
    console.log(`Client requests action: 'END_TURN' for player: ${localPlayerId}`);
    addLog("Запит на завершення ходу відправлено на сервер...");
}

// Add event listeners
doorDeckElement.addEventListener('click', handleDrawDoor);
endTurnBtn.addEventListener('click', handleEndTurn);


// --- Rendering (largely the same, but now uses Firestore data) ---

function renderFullUI() {
    if (!game) {
        console.log("Game state not loaded yet.");
        return;
    }
    renderPlayersHUD();
    renderPlayerHand();
}

function renderPlayersHUD() {
    playerHudContainer.innerHTML = '';
    // Assuming game.players is an array of player objects in Firestore
    game.players.forEach(player => {
        const hud = document.createElement('div');
        hud.className = 'player-hud';
        if(player.id === game.gameState.currentPlayerId) {
            hud.style.borderColor = 'gold';
        }
        hud.innerHTML = `
            <h3>${player.name}</h3>
            <p>Рівень: ${player.level}</p>
            <p>Сила: ${player.combatStrength}</p> <!-- Assuming this is calculated server-side -->
        `;
        playerHudContainer.appendChild(hud);
    });
}

function renderPlayerHand() {
    const localPlayer = game.players.find(p => p.id === localPlayerId);
    if (!localPlayer || !localPlayer.hand) {
        playerHandContainer.innerHTML = '<em>Ваша рука порожня.</em>';
        return;
    }

    playerHandContainer.innerHTML = '';
    localPlayer.hand.forEach(card => {
        const cardElement = createCardElement(card);
        playerHandContainer.appendChild(cardElement);
    });
}

function createCardElement(card) {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `<b>${card.title}</b><small>${card.subtype}</small>`;
    el.title = card.description;
    return el;
}

function addLog(message) {
    const li = document.createElement('li');
    li.textContent = `[${new Date().toLocaleTimeString()}]: ${message}`;
    logList.prepend(li);
}

addLog("Клієнт ініціалізовано. Очікування даних з Firebase...");
