import Deck from './Deck.js';
import Player from './Player.js';

class Game {
  constructor(playerIds, cardData) {
    this.players = playerIds.map(id => new Player(id, `Player ${id}`));
    this.doorDeck = new Deck(cardData.door);
    this.treasureDeck = new Deck(cardData.treasure);
    this.discard = {
      door: new Deck(),
      treasure: new Deck(),
    };
    this.currentPlayerIndex = 0;
    this.gameState = {
      phase: 'SETUP', // SETUP, DRAW_DOOR, COMBAT, LOOT, CHARITY, END_TURN
    };
  }

  startGame() {
    this.doorDeck.shuffle();
    this.treasureDeck.shuffle();
    // Deal starting hands (4 of each type to each player, if available)
    for (let i = 0; i < 4; i++) {
      for (const player of this.players) {
        if (this.doorDeck.count > 0) {
          player.drawCard(this.doorDeck);
        }
        if (this.treasureDeck.count > 0) {
          player.drawCard(this.treasureDeck);
        }
      }
    }
    this.gameState.phase = 'DRAW_DOOR';
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.gameState.phase = 'DRAW_DOOR';
    console.log(`It's now ${this.getCurrentPlayer().name}'s turn.`);
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  processAction(playerId, action, data) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player !== this.getCurrentPlayer()) {
      console.error("Not your turn!");
      return;
    }

    console.log(`Processing action: ${action} from ${player.name}`);
    // Action processing logic will go here
  }
}

export default Game;
