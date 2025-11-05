import fs from 'fs';
import Game from './game-engine/Game.js';

// 1. Load Card Data
let cardData;
try {
  const rawData = fs.readFileSync('assets/cards.json');
  cardData = JSON.parse(rawData);
} catch (error) {
  console.error("Could not read or parse cards.json", error);
  process.exit(1);
}

console.log("Card data loaded successfully.");

// 2. Initialize Game
const playerIds = ['player1', 'player2'];
const game = new Game(playerIds, cardData);
console.log("Game created for players:", playerIds);

// 3. Start Game
game.startGame();
console.log("Game started!");
console.log("Initial hands dealt.");
game.players.forEach(p => {
    console.log(`${p.name} hand count: ${p.hand.length}`);
});
console.log(`Door deck count: ${game.doorDeck.count}`);
console.log(`Treasure deck count: ${game.treasureDeck.count}`);
console.log("--------------------");

// 4. Simulate a Turn
let currentPlayer = game.getCurrentPlayer();
console.log(`It is ${currentPlayer.name}'s turn.`);

// Simulate drawing a door card
console.log(`${currentPlayer.name} kicks down the door...`);
const doorCard = currentPlayer.drawCard(game.doorDeck);
if (doorCard) {
  console.log(`...and finds: ${doorCard.title} (${doorCard.subtype})`);
} else {
  console.log(`...but the Door deck is empty!`);
}


// 5. Simulate another turn
game.nextTurn();
currentPlayer = game.getCurrentPlayer();

console.log(`${currentPlayer.name} kicks down the door...`);
const doorCard2 = currentPlayer.drawCard(game.doorDeck);
if (doorCard2) {
  console.log(`...and finds: ${doorCard2.title} (${doorCard2.subtype})`);
} else {
  console.log(`...but the Door deck is empty!`);
}

console.log("--------------------");
console.log("Test script finished.");
