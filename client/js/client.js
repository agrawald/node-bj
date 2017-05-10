'use strict';

const socket = io();
const peer = new Peer(socket.id, {host: 'localhost', port: 3000, path: '/peerjs'});

let anyBiggerNodeAlive = false;
let neighbours = [];
let isDealer = true;
let currentDealerId = null;

socket.on('NEW_PLAYER', addPlayer);
socket.on('REMOVE_PLAYER', removePlayer);
socket.on('START_GAME', startGame);
socket.on('ELECTION', election);
socket.on('WAIT', waitAndAskAgain);
socket.on('HIT', processAction);
socket.on('STAND', processAction);

function action(button) {
    console.log(`${button} clicked`);
    socket.emit(button, socket.id);
}

function addPlayer(player) {
    console.log(`NEW_PLAYER: ${player}`);
    new Player(JSON.parse(player), socket.id);
}

function removePlayer(playerId) {
    console.log(`REMOVE_PLAYER: ${playerId}`);
    let playerDiv = document.getElementById(JSON.parse(playerId))
    if (playerDiv) {
        playerDiv.remove();
    }
}

function startGame(players) {
    console.log(`START_GAME: ${players}`);
    renderPlayers(fromJSON(players));
}

function election(data) {
    console.log(`ELECTION: ${data}`);
    neighbours = data.peers;
    sendElectionMessage();
}

function renderPlayers(players) {
    document.getElementById('players').innerHTML = "";
    for (let i = 0; i < players.length; i++) {
        players[i].render();
    }
}


function waitAndAskAgain(data) {
    console.log("WAIT: will wait and ask again");
    showNotification(data);
}

function showNotification(message) {
    alert(message);
}

function fromJSON(players) {
    const _players = JSON.parse(players);
    const _oPlayers = [];
    for (let i = 0; i < _players.length; i++) {
        _oPlayers.push(new Player(_players[i], socket.id))
    }
    return _oPlayers;
}

function processAction(player) {
    console.log("HIT/STAND response ... ");
    const _player = JSON.parse(player);
    $(`#${_player.id}`).remove();
    new Player(_player, socket.id).render();
}

function findPeersWithHigherIds() {
    return neighbours.filter(function (peer) {
        return socket.id < peer;
    });
}

function sendElectionMessage() {
    anyBiggerNodeAlive = false;
    let peersWithHigherIds = findPeersWithHigherIds();

    peersWithHigherIds.forEach((_peer) => {
        peer.connect(_peer, function (conn) {
            conn.send('ELECTION', peer.id);
        });
    });
    setTimeout(() => {
        if (anyBiggerNodeAlive === false) {
            console.log(`i am the king!`.toUpperCase());
            isDealer = true;
            currentDealerId = socket.id;
            neighbours.forEach((_peer) => {
                peer.connect(_peer, function (conn) {
                    conn.send('COORDINATOR', socket.id);
                });
                socket.emit('START_GAME', socket.id);
            });
        }
    }, 1000 * neighbours.length - 1);
}

peer.on('ELECTION', function (id) {
    console.log(`${socket.id} got ELECTION...${id}`);
    peer.connect(id, function (conn) {
        conn.send('ANSWER', socket.id);
    });
});

peer.on('ANSWER', function (id) {
    console.log(`${socket.id} got ANSWER...${id}`);
    isDealer = false;
    anyBiggerNodeAlive = true;
});

peer.on('COORDINATOR', function (id) {
    console.log(`${socket.id} got COORDINATOR...${id}`);
    if (data < socket.id) {
        if (socket.id === currentDealerId) {
            console.log(`hey ${id}, my nodes are loyal to me!`.toUpperCase());
        } else {
            console.log(`so, yeah... thats akward ${id}, I'm gonna go ahead and start a new election`.toUpperCase());
        }
        sendElectionMessage();
    } else {
        currentDealerId = id;
        isDealer = false;
        anyBiggerNodeAlive = true;
        console.log(`long live node ${id}!`.toUpperCase());
    }
});
