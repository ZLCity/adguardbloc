const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const Game = require('../game-engine/Game.js');
const Deck = require('../game-engine/Deck.js');
const Player = require('../game-engine/Player.js');

// Helper function to reconstruct the game state from Firestore data
function rehydrateGame(gameData) {
    const game = new Game([], {}); // Create a shell

    // Rehydrate players
    game.players = gameData.players.map(pData => {
        const player = new Player(pData.id, pData.name);
        Object.assign(player, pData); // Copy properties
        return player;
    });

    // Rehydrate decks
    game.doorDeck = new Deck(gameData.doorDeck.cards);
    game.treasureDeck = new Deck(gameData.treasureDeck.cards);
    game.discard.door = new Deck(gameData.discard.door.cards);
    game.discard.treasure = new Deck(gameData.discard.treasure.cards);

    // Copy other properties
    game.currentPlayerIndex = gameData.currentPlayerIndex;
    game.gameState = gameData.gameState;
    game.combat = gameData.combat;

    return game;
}

exports.processGameAction = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  }

  const { gameId, action } = data;
  const playerId = context.auth.uid;
  const db = admin.firestore();
  const gameRef = db.collection('game_sessions').doc(gameId);

  try {
    const doc = await gameRef.get();
    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', 'Game session not found.');
    }

    const gameData = doc.data();
    const game = rehydrateGame(gameData);

    // --- Action Processing using the Game Engine ---
    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
        throw new functions.https.HttpsError('failed-precondition', 'It is not your turn.');
    }

    switch (action) {
        case 'KICK_OPEN_DOOR':
            if (game.gameState.phase !== 'DRAW_DOOR') {
                 throw new functions.https.HttpsError('failed-precondition', 'You cannot kick open the door right now.');
            }
            const card = currentPlayer.drawCard(game.doorDeck);
            if (!card) {
                // Handle empty deck
                game.gameState.phase = 'LOOT';
                break;
            }

            if (card.subtype === 'MONSTER') {
                game.startCombat(card);
            } else {
                // Handle curse, item, etc. (for now, just add to hand)
                game.gameState.phase = 'LOOT';
            }
            break;
        // ... other actions like 'PLAY_CARD', 'RESOLVE_COMBAT' would go here
    }

    // Convert the game object back to a plain object for Firestore
    const newGameData = JSON.parse(JSON.stringify(game));

    await gameRef.set(newGameData);

    return { status: 'success', message: 'Action processed.' };

  } catch (error) {
    console.error("Error processing game action:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
