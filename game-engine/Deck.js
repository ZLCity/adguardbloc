class Deck {
  constructor(cards = []) {
    this.cards = [...cards];
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    return this.cards.pop();
  }

  add(card) {
    this.cards.unshift(card);
  }

  get count() {
    return this.cards.length;
  }
}

export default Deck;
