import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";


// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);
const auth = getAuth(app);


// --- DOM Elements ---
const playerHudContainer = document.getElementById('players-hud-container');
const playerHandContainer = document.getElementById('player-hand');
const doorDeckElement = document.getElementById('door-deck');
const logList = document.getElementById('log-list');
const endTurnBtn = document.getElementById('end-turn-btn');

// --- Game State ---
let game;
let localPlayerId = null;
let gameSessionId = null;
let unsubscribeGame = null;

// --- Authentication & Game Initialization ---
onAuthStateChanged(auth, user => {
    if (user) {
        localPlayerId = user.uid;
        const urlParams = new URLSearchParams(window.location.search);
        gameSessionId = urlParams.get('gameId');

        if (gameSessionId) {
            addLog(`Authenticated as ${user.displayName}. Joining game ${gameSessionId}...`);
            subscribeToGameSession();
        } else {
            addLog("Error: No game ID found in URL. Please join a game from the lobby.");
        }
    } else {
        addLog("You are not signed in. Please go to the lobby to sign in.");
        localPlayerId = null;
    }
});

// --- Firestore Real-time Listener ---
function subscribeToGameSession() {
    if (unsubscribeGame) unsubscribeGame(); // Unsubscribe from any previous listener

    const gameSessionRef = doc(db, 'game_sessions', gameSessionId);
    unsubscribeGame = onSnapshot(gameSessionRef, (doc) => {
        if (doc.exists()) {
            game = doc.data();
            addLog("Game state updated from server.");
            renderFullUI();
        } else {
            addLog("Error: Game session not found.");
        }
    });
}


// --- Player Actions ---
const processGameAction = httpsCallable(functions, 'processGameAction');

async function handleDrawDoor() {
    if (!gameSessionId) {
        addLog("Cannot perform action: no game ID.");
        return;
    }
    addLog("Sending 'KICK_OPEN_DOOR' request...");
    try {
        const result = await processGameAction({ gameId: gameSessionId, action: 'KICK_OPEN_DOOR' });
        addLog(`Server responded: ${result.data.message}`);
    } catch (error) {
        console.error("Error calling Cloud Function:", error);
        addLog(`Error: ${error.message}`);
    }
}

// Event Listeners
doorDeckElement.addEventListener('click', handleDrawDoor);
endTurnBtn.addEventListener('click', () => addLog("End turn action not yet implemented."));


// --- Rendering ---
function renderFullUI() {
    if (!game || !localPlayerId) return;
    renderPlayersHUD();
    renderPlayerHand();
}

function renderPlayersHUD() {
    playerHudContainer.innerHTML = '';
    game.players.forEach(player => {
        const hud = document.createElement('div');
        hud.className = 'player-hud';
        if(player.id === game.players[game.currentPlayerIndex].id) {
            hud.style.borderColor = 'gold';
        }
        hud.innerHTML = `<h3>${player.name}</h3><p>Level: ${player.level}</p>`;
        playerHudContainer.appendChild(hud);
    });
}

function renderPlayerHand() {
    const localPlayer = game.players.find(p => p.id === localPlayerId);
    if (!localPlayer || !localPlayer.hand) {
        playerHandContainer.innerHTML = '<em>Your hand is empty.</em>';
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

addLog("Client initialized. Waiting for authentication...");
