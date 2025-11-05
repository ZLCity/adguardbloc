class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.level = 1;
    this.hand = [];
    this.equipped = {
      head: null,
      armor: null,
      legs: null,
      feet: null,
      hand1: null,
      hand2: null,
    };
    this.combatBonus = 0; // For one-shot potions, etc.
  }

  getCombatStrength() {
    let strength = this.level;
    for (const slot in this.equipped) {
      if (this.equipped[slot]) {
        strength += this.equipped[slot].bonus || 0;
      }
    }
    strength += this.combatBonus;
    return strength;
  }

  playCard(card) {
    // Basic logic, will be expanded
    console.log(`${this.name} plays ${card.title}`);
  }

  equip(itemCard) {
    if (itemCard.slot) {
      // Very basic equip logic
      this.equipped[itemCard.slot.toLowerCase()] = itemCard;
      return true;
    }
    return false;
  }

  drawCard(deck) {
    const card = deck.draw();
    if (card) {
      this.hand.push(card);
    }
    return card;
  }
}

module.exports = Player;
