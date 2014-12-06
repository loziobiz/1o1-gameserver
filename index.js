'use strict';

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var playersConnected = 0;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
        playersConnected--
    });

    socket.on('chat message', function(message){
        console.log(message);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
