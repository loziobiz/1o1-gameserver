'use strict';

var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    Room = require( './room'),
    Table = require( './table'),
    Game = require( './game' ),
    Player = require( './player'),
    _ = require('underscore'),
    Const = require('./const'),
    gamesConfig = require( './gamesConfig'),
    rooms = {
        tresette: new Room('tresette', "Tresette")
    };

app.set('port', (process.env.PORT || 5000));

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

    socket.on(Const.ProtocolEvents.PLAYER_CONNECT_REQUEST, function(nickname, roomId){
        player = new Player();
        player.socketId = socket.id;
        player.nickName = nickname;
        rooms[roomId].addPlayer(player);
        socket.emit( Const.ProtocolEvents.PLAYER_CONNECT_RESPONSE, {player: player} );

        console.log( 'player connected' );
    });

    socket.on(Const.ProtocolEvents.PLAYER_JOIN_REQUEST, function(playerId){
        socket.join( roomName );
        table1.playerJoin( player );

        socket.emit( Const.ProtocolEvents.PLAYER_JOIN_RESPONSE, {tableId: table1.id} );
        socket.broadcast.to( roomName ).emit( Const.ProtocolEvents.NOTIFY_PLAYER_JOIN, {tableId: table1.id} );
    });

    socket.on(Const.ProtocolEvents.PLAYER_READY_REQUEST, function(playerId){
        game1.setPlayerReady( playerId );

        socket.emit( Const.ProtocolEvents.PLAYER_READY_RESPONSE, {gameId: game1.id} );
        socket.broadcast.to( roomName ).emit( Const.ProtocolEvents.NOTIFY_PLAYER_READY, {gameId: game1.id, player: player} );
    });

    socket.on(Const.ProtocolEvents.PLAY_CARD_REQUEST, function(playerId, cardId){
        if ( game1.getPlayerToActId() ===  playerId ){
            var cardPlayed = game1.playCard( playerId, cardId );

            if ( cardPlayed ) {
                socket.emit( Const.ProtocolEvents.PLAY_CARD_RESPONSE, { cardId: cardId } );
                socket.broadcast.to( roomName ).emit( Const.ProtocolEvents.NOTIFY_PLAY_CARD, {gameId: game1.id, playerId: player.id, card: cardPlayed} );
            } else {
                socket.emit( 'notifyError', { code: 1002, msg: 'Card is not playable' } );
            }
        } else {
            socket.emit( 'notifyError', { code: 1001, msg: 'Wait your turn' } );
        }
    });

    //TODO: handle disconnection
});

game1.eventDispatcher.on(Const.Events.GAME_STARTED, function(gameId){
    console.log("started");

    game1.eventDispatcher.removeAllListeners( Const.Events.GAME_STARTED );

    _.defer(function(){
        io.to( roomName ).emit( Const, {gameId: gameId, players: table1.players} );
    });
});

game1.eventDispatcher.on(Const.Events.ROUND_NEW, function(dealerId){
    _.defer(function(){
        _.each(table1.players, function(element, index, list){
            //TODO: place dealer on client
            io.to( element.socketId ).emit( Const.ProtocolEvents.NOTIFY_NEW_ROUND, { holecards: element.holeCards, dealerId: dealerId } );
        });
    });
});

game1.eventDispatcher.on( Const.Events.GAME_WAITING, function(player){
    _.defer(function(){
        io.to( roomName ).emit( Const.Events.NOTIFY_WAIT_PLAYER_ACTION, {playerId: player.id} );
    });
} );

game1.eventDispatcher.on( Const.Events.TURN_ENDED, function(winnerId){
    _.defer(function(){
        io.to( roomName ).emit( Const.ProtocolEvents.NOTIFY_TURN_ENDED, {winnerId: winnerId} );
    });
} );

game1.eventDispatcher.on( Const.Events.TURN_STARTED, function(turnId){
    _.defer(function(){
        io.to( roomName ).emit( Const.ProtocolEvents.NOTIFY_TURN_STARTED, {turnId: turnId} );
    });
} );

game1.eventDispatcher.on( Const.Events.TURN_DRAW_CARDS, function(drawedCards){
    _.defer(function(){
        io.to( roomName ).emit( Const.ProtocolEvents.NOTIFY_DRAW_CARDS, {drawedCards: drawedCards} );
    });
} );

//TODO: when a playcard arrives check that player is authorized to move
/*
setInterval(function(){
    io.to('aa').emit( 'test', 'test' );
}, 2000);
*/

http.listen(app.get('port'), function(){
    console.log('listening on *:3000');
});
