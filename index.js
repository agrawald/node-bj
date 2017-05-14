const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const ExpressPeerServer = require('peer').ExpressPeerServer;

const Monitor = require('./server/monitor');
const monitor = new Monitor();
const options = {
    debug: true
};

app.use('/peerjs', ExpressPeerServer(server, options));
app.use(express.static(__dirname + '/node_modules'));

app.get('/', function(req, res,next) {
    console.log("Serving index.html...");
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/css', express.static(__dirname + '/client/css'));
app.use('/img', express.static(__dirname + '/client/img'));
app.use('/js', express.static(__dirname + '/client/js'));

io.on('connection', function (socket) {
    monitor.addPlayer(socket);
    socket.on('disconnect', function() {
        monitor.removePlayer(this.id);
    });
    socket.on('START_GAME', function (data) {
        monitor.startGame(data);
    });
    socket.on('HIT', function(data) {
        monitor.hit(data);
    });
    socket.on('STAND', function(data) {
        monitor.stand(data);
    });
    socket.on('DEALER', function(data) {
        monitor.dealerNominated(data);
    });
});

server.on('connection', function (id) {
    console.log(`Peer is connected ${id}`);
});
server.on('disconnect', function (id) {
    console.log(`Peer is disconnected ${id}`);
});


server.listen(3000);