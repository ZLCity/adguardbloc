import { firebaseConfig } from './firebase-config.js';

// --- Firebase Initialization ---
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// --- DOM Elements ---
const authSection = document.getElementById('auth-section');
const gamesListSection = document.getElementById('games-list-section');
const loginBtn = document.getElementById('login-btn');
const createGameBtn = document.getElementById('create-game-btn');
const gamesList = document.getElementById('games-list');

// --- Authentication ---
loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => console.error("Login failed:", error));
});

auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        authSection.style.display = 'none';
        gamesListSection.style.display = 'block';
        subscribeToGamesList(user.uid);
    } else {
        // User is signed out
        authSection.style.display = 'block';
        gamesListSection.style.display = 'none';
    }
});

// --- Lobby Logic ---
createGameBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to create a game.");
        return;
    }

    try {
        // Create a new game session document in Firestore
        const newGameRef = await db.collection('game_sessions').add({
            status: 'waiting', // waiting, in-progress, finished
            host: user.uid,
            players: [{ id: user.uid, name: user.displayName || 'Player 1' }],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("New game created with ID:", newGameRef.id);
        // Redirect to the game page (or handle joining logic)
        window.location.href = `index.html?gameId=${newGameRef.id}`;
    } catch (error) {
        console.error("Error creating game:", error);
    }
});

let gamesUnsubscribe = null;
function subscribeToGamesList(userId) {
    if (gamesUnsubscribe) gamesUnsubscribe(); // Unsubscribe from previous listener

    const query = db.collection('game_sessions').where('status', '==', 'waiting').orderBy('createdAt', 'desc');

    gamesUnsubscribe = query.onSnapshot(snapshot => {
        gamesList.innerHTML = ''; // Clear the list
        if (snapshot.empty) {
            gamesList.innerHTML = '<p>Немає доступних ігор. Створіть нову!</p>';
            return;
        }
        snapshot.forEach(doc => {
            const game = doc.data();
            const gameElement = document.createElement('div');
            gameElement.className = 'game-item';
            gameElement.innerHTML = `
                <span>Гра від ${game.players[0].name || 'Хост'} (${game.players.length}/4)</span>
                <button data-game-id="${doc.id}">Приєднатися</button>
            `;
            gamesList.appendChild(gameElement);
        });
    }, error => {
        console.error("Error fetching games list:", error);
    });
}
