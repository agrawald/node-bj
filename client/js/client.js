'use strict';

const socket = io();
let anyBiggerNodeAlive = false;
let neighbours = [];
let isDealer = false;
let currentDealerId = null;

socket.on('NEW_PLAYER', addPlayer);
socket.on('REMOVE_PLAYER', removePlayer);
socket.on('START_GAME', startGame);
socket.on('WAIT', waitAndAskAgain);
socket.on('HIT', processAction);
socket.on('STAND', processAction);
socket.on('TURN', processTurn);
socket.on('WINNER', processWinner);
socket.on('BUSTED', processBusted);
socket.on('UPDATE_PLAYERS', updatePlayers);

function updatePlayers(players) {
    let _oPlayers = fromJSON(players);
    renderPlayers(_oPlayers);
}

function processBusted(playerId) {
    let id = JSON.parse(playerId);
    if (id === socket.id) {
        console.log("I am busted");
        log('You are BUSTED!!!');
        alert("GAME OVER!");
    } else {
        log(`${id} is BUSTED!!!`);
    }
}
function processWinner(playerId) {
    let id = JSON.parse(playerId);
    if (id === socket.id) {
        console.log("I am the winner!!!");
        log("You are the winner!!!");
        alert("GAME OVER!");
        let form = document.getElementById("body");
        let elements = form.elements;
        for (let i = 0, len = elements.length; i < len; ++i) {
            elements[i].readOnly = true;
        }
    } else {
        log(`${id} is the winner!!!`);
    }
}


function processTurn(playerId) {
    if (JSON.parse(playerId) === socket.id) {
        log(`My Turn...`);
        $(`#actions-${socket.id}`).find(`button`).prop('disabled', false);
    } else {
        log(`${playerId} turn...`);
        $(`#actions-${socket.id}`).find(`button`).prop('disabled', true);
    }
}

function action(button) {
    console.log(`${button} clicked`);
    socket.emit(button, socket.id);
}

function addPlayer(player) {
    console.log(`NEW_PLAYER: ${player}`);
    let newPlayer = new Player(JSON.parse(player), socket.id);
    if (newPlayer.isDealer) {
        if (socket.id === newPlayer.id) {
            isDealer = true;
        }
        currentDealerId = newPlayer.id;
    }
    neighbours.push(newPlayer.socket.id);
    log(`New Player added: ${newPlayer.id}`);
}

$('#result').change(function () {
    $('#object').scrollTop($('#object')[0].scrollHeight);
});
function log(msg) {
    console.log(msg);
    $('#result').append("\n" + msg);
    $('#result').scrollTop = $('#result').scrollHeight;
}

function removePlayer(playerId) {
    let id = JSON.parse(playerId);
    let playerDiv = document.getElementById(id);
    if (playerDiv) {
        playerDiv.remove();
        log(`Player removed: ${id}`);
    }
    for (let i = 0; i < neighbours.length; i++) {
        if (id === neighbours[i]) {
            neighbours.splice(i, 1);
            if (currentDealerId === id) {
                sendElectionMessage();
                log(`Dealer removed: ${id}, starting election!!!`);
            }
            break;
        }
    }
}

function startGame(players) {
    $('#result').text("");
    let _oPlayers = fromJSON(players);
    renderPlayers(_oPlayers);
    for (let i = 0; i < _oPlayers.length; i++) {
        if (_oPlayers[i].isDealer) {
            if (socket.id === _oPlayers[i].id) {
                isDealer = true;
            }
            currentDealerId = _oPlayers[i].id;
        }
        neighbours.push(_oPlayers[i].id);
    }

    log(`Game started`);
}

function renderPlayers(players) {
    players.sort(function (a, b) {
        return ((a.id < b.id) ? -1 : ((a.id > b.id) ? 1 : 0));
    });

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
    log("" + data.msg);
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
    const _player = JSON.parse(player);
    $(`#${_player.id}`).remove();
    let _oPlayer = new Player(_player, socket.id);
    _oPlayer.render();
    log(`HIT\\STAND from player ${_player.id}`);
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

function sendElectionMessage(data) {
    anyBiggerNodeAlive = false;
    let peersWithHigherIds = findPeersWithHigherIds();

    for (let i = 0; i < peersWithHigherIds.length; i++) {
        log(`${socket.id}: Sending ELECTION -> ${peersWithHigherIds[i]}`);
        socket.emit('ELECTION', socket.id);
    }

    setTimeout(() => {
        if (anyBiggerNodeAlive === false) {
            log(`${socket.id}: I AM THE KING! Will let the world know`);
            isDealer = true;
            currentDealerId = socket.id;
            $('#role').text("DEALER");
            log(`${socket.id}: Sending COORDINATOR -> ${neighbours}`);
            socket.emit('COORDINATOR', socket.id);
            socket.emit('DEALER', socket.id);
        } else {
            $('#role').text("");
            log(`${socket.id}: Bigger node is still alive.... shutting my mouth`)
        }
    }, 100 * neighbours.length - 1);
}

socket.on('ELECTION', function (json) {
    let id = JSON.parse(json);
    if (id !== socket.id) {
        log(`${socket.id}: ELECTION from ${id}, sending ANSWER`);
        socket.emit('ANSWER', {
            to: id,
            from: socket.id
        });
    }
});

socket.on('ANSWER', function (data) {
    log(`${data.to}: ANSWER from bigger node ${data.from}`);
    isDealer = false;
    anyBiggerNodeAlive = true;
    $('#role').text("");
});

socket.on('COORDINATOR', function (json) {
    let id = JSON.parse(json);
    if (id !== socket.id) {
        if (id < socket.id) {
            if (socket.id === currentDealerId) {
                log(`${socket.id}: hey ${id}, my nodes are loyal to me!`);
            } else {
                log(`${socket.id}: so, yeah... thats akward ${id}, I'm gonna go ahead and start a new election`);
                sendElectionMessage();
            }
        } else {
            $('#role').text("");
            currentDealerId = id;
            isDealer = false;
            anyBiggerNodeAlive = true;
            log(`${socket.id}: long live node ${id}!`.toUpperCase());
        }
    }
});

