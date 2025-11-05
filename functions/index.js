const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// This is a placeholder for our Game Engine.
// In a real project, you'd import the classes from the /game-engine directory.
// For simplicity here, we'll just include a stub.
const Game = require('../game-engine/Game.js'); // This won't work out-of-the-box, requires bundling or restructuring

/**
 * This is the main Cloud Function that will process all player actions.
 * It's triggered via HTTPS request from the client.
 *
 * @param {object} data - The data sent from the client.
 *   - gameId: The ID of the game session.
 *   - action: The action being performed (e.g., 'DRAW_DOOR').
 *   - playerId: The ID of the player performing the action.
 * @param {object} context - Firebase context, contains auth info.
 */
exports.processGameAction = functions.https.onCall(async (data, context) => {
  // 1. Authentication: Ensure the user is logged in.
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to perform an action.');
  }

  const { gameId, action, playerId } = data;
  const db = admin.firestore();
  const gameRef = db.collection('game_sessions').doc(gameId);

  try {
    const doc = await gameRef.get();
    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', 'Game session not found.');
    }

    let gameState = doc.data();

    // 2. Authorization & Validation: Ensure the action is valid.
    // Is it this player's turn? Is the action valid for the current game phase?
    // (Logic to be added here)

    // 3. Action Processing: Use the Game Engine to update the state.
    // This is a conceptual example. A real implementation would need to
    // instantiate the Game class with the state from Firestore.
    console.log(`Processing action '${action}' for game '${gameId}' by player '${playerId}'`);
    // let game = new Game(gameState.players, gameState.cards); // Rehydrate game state
    // game.processAction(playerId, action, data);
    // let newState = game.getState(); // Get the new state from the engine

    // --- Placeholder logic for now ---
    if (action === 'DRAW_DOOR') {
        gameState.log.push(`${playerId} drew a door card.`);
    }
    // --- End Placeholder ---


    // 4. Save new state to Firestore.
    await gameRef.set(gameState);

    return { status: 'success', message: 'Action processed successfully.' };

  } catch (error) {
    console.error("Error processing game action:", error);
    throw new functions.https.HttpsError('internal', 'An error occurred while processing the action.');
  }
});
