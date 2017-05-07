'use strict';
const Deck = require('./deck.js');

module.exports = class Game {
    constructor() {
        this.deck = new Deck();
        this.inProgress = false;

    }

    start(players) {
        console.log("... starting the game");
        this.inProgress = true;
        for(let i=0; i<players.length; i++) {
            let player = players[i];
            player.addCard(this.deck.nextCard());
            if(!player.isDealer) {
                player.addCard(this.deck.nextCard());
            }
        }
    }

    stop() {
        console.log("... stopping the game");
        this.inProgress = false;
        this.deck.reset();
    }
};