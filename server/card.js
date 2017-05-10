'use strict';

module.exports = class Card {
    constructor(number) {
        this.number = number;
        this.suit = ['C', 'D', 'H', 'S'][Math.floor(number / 13)];
        this.rank = (number % 13) + 1;
    }

    score() {
        if (this.rank === 1) {
            return 11;
        } else if (this.rank >= 11) {
            return 10;
        }
        return this.rank;
    }

    toJSON() {
        return {
            suit: this.suit,
            rank: this.rank
        }
    }
};