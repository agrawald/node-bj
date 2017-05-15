'use strict';

const Player = require('./player');
const Game = require('./game');

module.exports = class Monitor {
    constructor() {
        this.players = [];
        this.game = new Game();
        this.turn = null;
    }

    dealerNominated(dealerId) {
        let id = dealerId;
        for(let i=0; i<this.players.length; i++) {
            let player = this.players[i];
            if(id === player.socket.id) {
                player.isDealer = true;
                if(player.socket.id === this.turn) {
                    let nextIdx = this.nextTurn(i);
                    this.players[nextIdx].myTurn = true;
                    this.turn = this.players[nextIdx];
                }
            } else {
                player.isDealer = false;
            }
        }
        this.broadcast('UPDATE_PLAYERS', this.players);
        this.broadcast("TURN", this.turn);
    }

    addPlayer(socket) {
        let player = new Player(socket);
        this.players.push(player);

        if (this.players.length < 5) {
            console.error("... need more players to start a game");
            socket.emit('WAIT', {
                msg: 'Need more players to start a game....',
                existingPlayers: this.players
            });
        } else if (this.game.inProgress) {
            console.log("... new player wanted to play, but game in progress")
            socket.emit('WAIT', {
                msg: 'game in progress',
                existingPlayers: this.players
            });
        } else {
            let dealerId = this.players.length -1;
            this.players[dealerId].isDealer = true;
            this.game.start(this.players);
            this.players[0].myTurn = true;
            this.turn = this.players[0].socket.id;
            this.broadcast("START_GAME", this.players);
            this.broadcast("TURN", this.players[0].socket.id);
        }
    }

    startGame(data) {
        console.log("Dealer identified starting the game");
        this.players.forEach(function (player) {
            player.isDealer = (player.socket.id === data)
            player.currentDealerId = data;
        });
        this.game.start(this.players);
        this.broadcast('START_GAME', this.players);
    }

    removePlayer(playerId) {
        if (this.players) {
            for (let i = 0; i < this.players.length; i++) {
                let player = this.players[i];
                if (player.socket.id === playerId) {
                    this.players.splice(i, 1);
                    this.broadcast('REMOVE_PLAYER', playerId);
                    if (this.players.length <= 1) {
                        console.log("... less that one player");
                        if (this.players.length === 1) {
                            console.log("... only one player left, he is the winner");
                            this.broadcast('WINNER', this.players[0].socket.id);
                        }
                        this.game.stop();
                    }
                    break;
                }
            }
        } else {
            console.log(`... no players left`);
            if (this.game.inProgress) {
                this.game.stop();
            }
        }
    }

    findDealer() {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].isDealer) {
                return this.players[i];
            }
        }
    }

    findPlayer(id) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].socket.id === id) {
                return this.players[i];
            }
        }
    }

    broadcast(type, message) {
        console.log(`BROADCAST: ${type} -> ${message}`);
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].socket.emit(type, JSON.stringify(message));
        }
    }

    hit(data) {
        if (this.game && this.game.inProgress) {
            console.log(`HIT: ${data}`);
            for (let i = 0; i < this.players.length; i++) {
                if (data === this.players[i].socket.id) {
                    let _oPlayer = this.players[i];
                    _oPlayer.addCard(this.game.deck.nextCard());
                    //broadcast HIT result
                    this.broadcast('HIT', _oPlayer);
                    let turnIdx = this.nextTurn(i);
                    this.players[turnIdx].myTurn = true;
                    this.turn = this.players[turnIdx].socket.id;
                    this.broadcast("TURN", this.players[turnIdx].socket.id);
                    //identify winner
                    if (_oPlayer.isBusted()) {
                        this.broadcast('BUSTED', _oPlayer.socket.id);
                        this.removePlayer(_oPlayer.socket.id);
                    }

                    break;
                }
            }
        }
    }

    nextTurn(i) {
        let nextTurn = i + 1;
        if (this.players[nextTurn].isDealer) {
            nextTurn += 1;
        }
        if (nextTurn >= this.players.length) {
            nextTurn = 0;
        }
        return nextTurn;
    }

    stand(data) {
        if (this.game && this.game.inProgress) {
            console.log(`STAND: ${data}`);
            const _oDealer = this.findDealer();
            while (_oDealer.score() < 17) {
                _oDealer.addCard(this.game.deck.nextCard());
            }
            //broadcast stand
            this.broadcast('STAND', _oDealer);
            //change the turn
            for (let i = 0; i < this.players.length; i++) {
                if (data === this.players[i].socket.id) {
                    let turnIdx = this.nextTurn(i);
                    this.players[turnIdx].myTurn = true;
                    this.turn = this.players[turnIdx].socket.id;
                    this.broadcast("TURN", this.players[turnIdx].socket.id);
                    break;
                }
            }
            //identify winner
            let player = this.findPlayer(data);
            if (player.isBusted()) {
                this.broadcast('BUSTED', player.socket.id);
                this.removePlayer(player.socket.id);
            } else if (_oDealer.isBusted()) {
                this.broadcast('WINNER', player.socket.id);
                this.removePlayer(player.socket.id);
                _oDealer.CARDS = [];
                _oDealer.addCard(this.game.deck.nextCard());
            }
        }
    }
};