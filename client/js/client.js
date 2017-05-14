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
socket.on('WAIT', waitAndAskAgain);
socket.on('HIT', processAction);
socket.on('STAND', processAction);

function action(button) {
    console.log(`${button} clicked`);
    socket.emit(button, socket.id);
}

function addPlayer(player) {
    console.log(`NEW_PLAYER: ${player}`);
    let newPlayer = new Player(JSON.parse(player), socket.id);
    neighbours.push(newPlayer.socket.id);
}

function removePlayer(playerId) {
    console.log(`REMOVE_PLAYER: ${playerId}`);
    let playerDiv = document.getElementById(JSON.parse(playerId));
    if (playerDiv) {
        playerDiv.remove();
    }
    neighbours.splice(neighbours.findIndex(function (id) {
        return id === playerId
    }), 1);
}

function startGame(players) {
    console.log(`START_GAME: ${players}`);
    renderPlayers(fromJSON(players));
}

function renderPlayers(players) {
    let me = null;
    document.getElementById('players').innerHTML = "";
    for (let i = 0; i < players.length; i++) {
        players[i].render();
    }
    $(`#hit${socket.id}`).click = function (e) {
        socket.emit('HIT', socket.id);
    };
    $(`#stand${socket.id}`).click = function (e) {
        socket.emit('STAND', socket.id);
    };
}


function waitAndAskAgain(data) {
    console.log("WAIT: will wait and ask again");
    showNotification(data.msg);
    // let players = fromJSON(data.exisitingPlayers);
    // neighbours = [];
    // for(let i=0; i<players.length; i++) {
    //     neighbours.push(players[i].socket.id);
    // }
    // renderPlayers(players);
    // showNotification(data.msg);
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
    let peersWithHigherIds = [];
    for (let i = 0; i < neighbours.length; i++) {
        if (socket.id < neighbours[i]) {
            peersWithHigherIds.push(neighbours[i]);
        }
    }
    return peersWithHigherIds;
}

function sendElectionMessage() {
    anyBiggerNodeAlive = false;
    let peersWithHigherIds = findPeersWithHigherIds();

    for (let i = 0; i < peersWithHigherIds.length; i++) {
        let conn = peer.connect(peersWithHigherIds[i]);
        console.log(`${socket.id}: Sending ELECTION -> ${peersWithHigherIds[i]}`)
        conn.send('ELECTION', socket.id);
    }

    if (peersWithHigherIds.length > 0) {
        setTimeout(() => {
            if (anyBiggerNodeAlive === false) {
                console.log(`${socket.id}: I AM THE KING! Will let the world know`);
                isDealer = true;
                currentDealerId = socket.id;
                for (let i = 0; i < neighbours.length; i++) {
                    let conn = peer.connect(neighbours[i]);
                    console.log(`${socket.id}: Sending COORDINATOR -> ${neighbours[i]}`)
                    conn.send('COORDINATOR', socket.id);
                }
            } else {
                console.log(`${socket.id}: Bigger node is still alive.... shutting my mouth`)
            }
        }, 1000 * neighbours.length - 1);
    }
}

peer.on('ELECTION', function (id) {
    console.log(`${socket.id}: ELECTION from ${id}, sending ANSWER`);
    let conn = peer.connect(id);
    conn.send('ANSWER', socket.id);
});

peer.on('ANSWER', function (id) {
    console.log(`${socket.id}: ANSWER from bigger node ${id}`);
    isDealer = false;
    anyBiggerNodeAlive = true;
});

peer.on('COORDINATOR', function (id) {
    console.log(`${socket.id}: COORDINATOR from ${id}`);
    if (id < socket.id) {
        if (socket.id === currentDealerId) {
            console.log(`${socket.id}: hey ${id}, my nodes are loyal to me!`.toUpperCase());
        } else {
            console.log(`${socket.id}: so, yeah... thats akward ${id}, I'm gonna go ahead and start a new election`.toUpperCase());
            sendElectionMessage();
        }
    } else {
        currentDealerId = id;
        isDealer = false;
        anyBiggerNodeAlive = true;
        console.log(`${socket.id}: long live node ${id}!`.toUpperCase());
    }
});

