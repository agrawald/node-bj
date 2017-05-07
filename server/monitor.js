'use strict';

const Player = require('./player');
const Game = require('./game');

module.exports = class Monitor {
    constructor() {
        this.players = [];
        this.game = new Game();
    }

    addPlayer(socket) {
        let player = new Player(socket);
        this.players.push(player);
        if (this.players.length >= 2 && !this.game.inProgress) {
            this.game.start(this.players);
            this.broadcast('START_GAME', this.players);
        } else {
            console.log("... new player wanted to play, but game in progress")
            socket.emit('WAIT', 'TODO');
        }
    }

    removePlayer(playerId) {
        if (this.players) {
            let _this = this;
            this.players.forEach(function (player, idx) {
                if (player.socket.id === playerId) {
                    _this.players.splice(idx, 1);
                }
            });
            this.broadcast('REMOVE_PLAYER', playerId);
            if (this.players.length <= 0) {
                this.game.stop();
            }
        } else {
            console.log(`... no players left`)
            if (this.game.inProgress) {
                this.game.stop();
            }
        }
    }

    findPlayer(that) {
        return this.players.find(function (player) {
            return player.socket.id === that.id;
        })
    }

    findDealer() {
        return this.players.find(function (player) {
            return player.isDealer;
        })
    }

    broadcast(type, message) {
        console.log(`BROADCAST: ${type} -> ${message}`);
        this.players.forEach(function (player) {
            player.socket.emit(type, JSON.stringify(message));
        });
    }

    hit(data) {
        if (this.game && this.game.inProgress) {
            console.log(`HIT: ${data}`);
            const player = JSON.parse(data);
            const _oPlayer = this.findPlayer(player);
            _oPlayer.addCard(this.game.deck.nextCard());
            this.broadcast('HIT', JSON.stringify(_oPlayer));
        }
    }

    stand(data) {
        if (this.game && this.game.inProgress) {
            console.log(`STAND: ${data}`);
            const _oDealer = this.findDealer();
            while (_oDealer.score() < 17) {
                _oDealer.addCard(this.game.deck.nextCard());
            }
            this.broadcast('STAND', JSON.stringify(_oDealer));
        }
    }

    //FIXME HERE
    result(_oPlayer, _oDealer) {
        const playerScore = _oPlayer.score();
        const dealerScore = _oDealer.score();

        if (_oPlayer.isBusted()) {
            _oPlayer.won = false;
        } else if (_oDealer.isBusted()) {
            _oPlayer.won = true;
        }

        if (playerScore > dealerScore) {
            _oPlayer.won = true;
        } else if (playerScore === dealerScore) {
            _oPlayer.push = true;
        }
        _oPlayer.won = false;
    }


    election(socket) {
        console.log(`ELECTION started by ${socket.id}`)
        this.broadcast('ELECTION', 'TODO');
    }
}
;