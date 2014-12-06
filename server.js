'use strict';

var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    Room = require( './room'),
    Table = require( './table'),
    Game = require( './game' ),
    Card = require( './card' ),
    Player = require( './player'),
    ai = require( './ai'),
    _ = require('underscore'),
    gamesConfig = require( './gamesConfig'),
    rooms = {
        tresette: new Room('tresette', "Tresette")
    };

var table1 = new Table('001');
var game1 = new Game( gamesConfig.tresette );

var clients = {};

table1.gameObj = game1;
game1.setTable( table1 );

rooms.tresette.addTable(table1);


app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

var roomName = 'table' + table1.id;

io.on('connection', function(socket){
    var player = {};
    clients[socket.id] = socket;

    //TODO: add room list dispatch

    socket.on('playerConnectRequest', function(nickname, roomId){
        player = new Player();
        player.socketId = socket.id;
        player.nickName = nickname;
        rooms[roomId].addPlayer(player);
        socket.emit( 'playerConnectResponse', {player: player} );

        console.log( 'player connected' );
    });

    socket.on('playerJoinRequest', function(playerId){
        socket.join( roomName );
        table1.playerJoin( player );

        socket.emit( 'playerJoinResponse', {tableId: table1.id} );
        socket.broadcast.to( roomName ).emit( 'notifyPlayerJoin', {tableId: table1.id} );
    });

    socket.on('playerReadyToPlayRequest', function(playerId){
        game1.setPlayerReady( playerId );

        socket.emit( 'playerReadyToPlayResponse', {gameId: game1.id} );
        socket.broadcast.to( roomName ).emit( 'notifyPlayerReadyToPlay', {gameId: game1.id, player: player} );
    });

    socket.on('playCardRequest', function(playerId, cardId){
        if ( game1.getPlayerToActId() ===  playerId ){
            var cardPlayed = game1.playCard( playerId, cardId );

            if ( cardPlayed ) {
                socket.emit( 'playCardResponse', { cardId: cardId } );
                socket.broadcast.to( roomName ).emit( 'notifyPlayCard', {gameId: game1.id, playerId: player.id, card: cardPlayed} );
            } else {
                socket.emit( 'notifyError', { code: 1002, msg: 'Card is not playable' } );
            }
        } else {
            socket.emit( 'notifyError', { code: 1001, msg: 'Wait your turn' } );
        }
    });

    //TODO: handle disconnection
});

game1.eventDispatcher.on('game_started', function(gameId){
    console.log("started");

    game1.eventDispatcher.removeAllListeners('game_started');

    _.defer(function(){
        io.to( roomName ).emit( 'notifyGameStarted', {gameId: gameId, players: table1.players} );
    });
});

game1.eventDispatcher.on('NEW_ROUND', function(dealerId){
    _.defer(function(){
        _.each(table1.players, function(element, index, list){
            //TODO: place dealer on client
            io.to( element.socketId ).emit( 'notifyNewRound', { holecards: element.holeCards, dealerId: dealerId } );
        });
    });
});

game1.eventDispatcher.on( 'GAME_WAITING', function(player){
    _.defer(function(){
        io.to( roomName ).emit( 'notifyWaitingForPlayerAction', {playerId: player.id} );
    });
} );

game1.eventDispatcher.on( 'TURN_ENDED', function(winnerId){
    _.defer(function(){
        io.to( roomName ).emit( 'notifyTurnEnded', {winnerId: winnerId} );
    });
} );

game1.eventDispatcher.on( 'TURN_STARTED', function(turnId){
    _.defer(function(){
        io.to( roomName ).emit( 'notifyTurnStarted', {turnId: turnId} );
    });
} );

game1.eventDispatcher.on( 'TURN_DRAW_CARDS', function(drawedCards){
    _.defer(function(){
        io.to( roomName ).emit( 'notifyDrawCards', {drawedCards: drawedCards} );
    });
} );

//TODO: when a playcard arrives check that player is authorized to move
/*
setInterval(function(){
    io.to('aa').emit( 'test', 'test' );
}, 2000);
*/

http.listen(3000, function(){
    console.log('listening on *:3000');
});
