'use strict';

const socket = io();

socket.on('NEW_PLAYER', addPlayer);
socket.on('REMOVE_PLAYER', removePlayer);
socket.on('START_GAME', startGame);
socket.on('ELECTION', election);
socket.on('WAIT', waitAndAskAgain);
socket.on('HIT', processAction);
socket.on('STAND', processAction);

let me = null;

function addPlayer(player) {
    console.log(`NEW_PLAYER: ${player}`);
    new Player(JSON.parse(player));
    if (player.id === socket.id) {
        me = JSON.parse(player);
    }
}

function removePlayer(playerId) {
    console.log(`REMOVE_PLAYER: ${playerId}`);
    document.getElementById(JSON.parse(playerId)).remove();
}

function startGame(players) {
    console.log(`START_GAME: ${players}`);
    renderPlayers(fromJSON(players));
}

function election(data) {
    console.log(`ELECTION: ${data}`);
    //TODO if i am bigger send and start election again
    //else keep quite
}

function renderPlayers(players) {
    document.getElementById('players').innerHTML = "";
    for (let i = 0; i < players.length; i++) {
        players[i].render();
    }
}


function waitAndAskAgain() {
    console.log("WAIT: will wait and ask again");
    //TODO
}

function fromJSON(players) {
    const _players = JSON.parse(players);
    const _oPlayers = [];
    for (let i = 0; i < _players.length; i++) {
        _oPlayers.push(new Player(_players[i]))
    }
    return _oPlayers;
}

function processAction(player) {
    console.log("HIT/STAND response ... ");
    const _player = JSON.parse(player);
    delete document.getElementById(_player.id);
    new Player(_player).render();
}

function registerActions() {
    $('#hit').onclick = function () {
        console.log("HIT clicked")
        socket.emit('HIT', JSON.stringify(me));
    };

    $('#stand').onclick = function () {
        console.log("STAND clicked")
        socket.emit('STAND', JSON.stringify(me));
    };
}

registerActions();
