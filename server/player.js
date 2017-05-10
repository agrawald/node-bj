'use strict';

const Card = require('./card');

module.exports = class Player {
    constructor(socket) {
        this.socket = socket;
        this.cards = [];
        this.myTurn = false;
        this.isDealer = false;
        this.won = false;
        this.push = false;
    }

    addCard(card) {
        console.log(`... adding ${card}`);
        this.cards.push(card);
    }

    score() {
        console.log("... calculating score");
        let cards = this.cards;

        // filter all aces
        let aces = cards.filter(function (card) {
            return card.rank === 1;
        });

        let nonAces = cards.filter(function (card) {
            return card.rank !== 1;
        });

        let score = nonAces.reduce(function (acc, nonAce) {
            return acc + nonAce.score();
        }, 0);

        let acesScore = aces.length * 11;
        let acesLeft = aces.length;
        while ((acesLeft > 0) && (acesScore + score) > 21) {
            acesLeft = acesLeft - 1;
            acesScore = acesScore - 10;
        }

        score = score + acesScore;
        console.log(`... score -> ${score}`);
        return score;
    }

    isBusted() {
        return this.score() > 21;
    }

    hasCards() {
        return this.cards.length > 0;
    }

    toJSON() {
        return {
            id: this.socket.id,
            name: this.socket.id,
            cards: this.cards,
            score: this.score(),
            isBusted: this.isBusted(),
            myTurn: this.myTurn,
            isDealer: this.isDealer
        }
    }
};