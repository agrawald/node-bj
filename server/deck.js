'use strict';
const Card = require('./card');

module.exports = class Deck {
    constructor() {
        this.cards = [];
        this.next = 0;
        this.shuffle();
    }

    reset() {
        this.next = 0;
    }

    shuffle() {
        console.log("... shuffling the deck");
        this.cards[0] = new Card(0);
        for (let i = 1; i < 52; i++) {
            const j = Math.floor(Math.random() * (i + 1));
            this.cards[i] = this.cards[j];
            this.cards[j] = new Card(i);
        }
    }

    nextCard() {
        console.log(`... dealing the next card from ${this.next}`)
        if (this.next >= this.cards.length) {
            this.cards = this.shuffle();
            this.next = 0;
            console.log(".... created a new deck");
        }

        const nextCard = this.cards[this.next];
        this.next++;
        return nextCard;
    }

};