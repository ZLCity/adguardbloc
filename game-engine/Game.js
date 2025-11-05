const Deck = require('./Deck.js');
const Player = require('./Player.js');

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
      phase: 'SETUP', // SETUP, KICK_OPEN_DOOR, COMBAT, LOOT, CHARITY, END_TURN
    };
    this.combat = null; // { monster, monsterBonus, playerBonuses }
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

  // --- Combat Phase Logic ---

  startCombat(monsterCard) {
    if (this.gameState.phase === 'COMBAT') {
      console.error("Cannot start a new combat while another is in progress.");
      return;
    }
    this.gameState.phase = 'COMBAT';
    this.combat = {
      monster: monsterCard,
      monsterBonus: 0,
      playerBonuses: 0, // From one-shot items, etc.
      helpers: [], // IDs of players helping
    };
    console.log(`${this.getCurrentPlayer().name} is now fighting a ${monsterCard.title}!`);
  }

  resolveCombat() {
    if (this.gameState.phase !== 'COMBAT') return;

    const player = this.getCurrentPlayer();
    const playerStrength = player.getCombatStrength() + this.combat.playerBonuses;
    const monsterStrength = this.combat.monster.level + this.combat.monsterBonus;

    console.log(`Resolving combat: Player strength (${playerStrength}) vs. Monster strength (${monsterStrength})`);

    if (playerStrength > monsterStrength) {
      // Player wins
      console.log("Player wins the combat!");
      player.level += 1; // Basic level up
      this.drawTreasures(this.combat.monster.treasures || 1);
      this.endCombat();
    } else {
      // Player loses, must run away
      this.attemptToRunAway();
    }
  }

  attemptToRunAway() {
    const player = this.getCurrentPlayer();
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    console.log(`${player.name} attempts to run away... rolls a ${diceRoll}`);

    if (diceRoll >= 5) { // Munchkin rule: 5 or 6 to escape
      console.log("...and succeeds!");
      this.endCombat();
    } else {
      console.log("...and fails! Bad stuff happens.");
      // In a full implementation, you'd apply the monster's "Bad Stuff" effect here.
      this.endCombat();
    }
  }

  drawTreasures(count) {
    const player = this.getCurrentPlayer();
    console.log(`${player.name} draws ${count} treasure(s).`);
    for (let i = 0; i < count; i++) {
      if (this.treasureDeck.count > 0) {
        player.drawCard(this.treasureDeck);
      }
    }
  }

  endCombat() {
    this.combat = null;
    this.gameState.phase = 'LOOT'; // Or CHARITY, depending on what's next
    console.log("Combat has ended.");
  }
}

module.exports = Game;
