import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- DOM Elements ---
const authSection = document.getElementById('auth-section');
const gamesListSection = document.getElementById('games-list-section');
const loginBtn = document.getElementById('login-btn');
const createGameBtn = document.getElementById('create-game-btn');
const gamesList = document.getElementById('games-list');

// --- Authentication ---
loginBtn.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => console.error("Login failed:", error));
});

onAuthStateChanged(auth, user => {
    if (user) {
        authSection.style.display = 'none';
        gamesListSection.style.display = 'block';
        subscribeToGamesList(user.uid);
    } else {
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
        const newGameRef = await addDoc(collection(db, 'game_sessions'), {
            status: 'waiting',
            host: user.uid,
            players: [{ id: user.uid, name: user.displayName || 'Player 1' }],
            createdAt: serverTimestamp()
        });
        window.location.href = `index.html?gameId=${newGameRef.id}`;
    } catch (error) {
        console.error("Error creating game:", error);
    }
});

let gamesUnsubscribe = null;
function subscribeToGamesList(userId) {
    if (gamesUnsubscribe) gamesUnsubscribe();

    const q = query(collection(db, 'game_sessions'), where('status', '==', 'waiting'), orderBy('createdAt', 'desc'));

    gamesUnsubscribe = onSnapshot(q, (querySnapshot) => {
        gamesList.innerHTML = '';
        if (querySnapshot.empty) {
            gamesList.innerHTML = '<p>Немає доступних ігор. Створіть нову!</p>';
            return;
        }
        querySnapshot.forEach((doc) => {
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
