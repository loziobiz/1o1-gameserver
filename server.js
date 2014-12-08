'use strict';

var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    Room = require( './room'),
    Player = require( './player'),
    _ = require('underscore'),
    Const = require('./const'),
    roomsConfig = require('./roomsConf'),
    rooms = {},
    runningGames = {},
    clients = {};

app.set('port', (process.env.PORT || 5000));

_.each(roomsConfig, function(value, key, list){
    rooms[key] = new Room( key, value );
    rooms[key].on( Const.Events.TABLE_START_PLAYING, function(table){
        runningGames[table.gameObj.id] = table.gameObj;
        attachGameHandlers( runningGames[table.gameObj.id] );
    } );
});

app.use( express.static(__dirname + '/www-client') );

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    var player = {};
    clients[socket.id] = socket;

    //TODO: add room list dispatch

    socket.on(Const.ProtocolEvents.PLAYER_CONNECT_REQUEST, function(nickname, roomId){
        player = new Player();
        player.socketId = socket.id;
        player.nickName = nickname;
        rooms[roomId].addPlayer(player);
        socket.emit( Const.ProtocolEvents.PLAYER_CONNECT_RESPONSE, {player: player, roomData: rooms[roomId].getData()} );

        console.log( 'player connected' );
    });

    socket.on(Const.ProtocolEvents.PLAYER_JOIN_REQUEST, function(playerId, roomId, tableId){
        socket.join( tableId );
        var table = rooms[roomId].tables[tableId];
        table.playerJoin( player );

        socket.emit( Const.ProtocolEvents.PLAYER_JOIN_RESPONSE, {table: table} );
        socket.broadcast.to( tableId ).emit( Const.ProtocolEvents.NOTIFY_PLAYER_JOIN, {table: table} );
    });

    socket.on(Const.ProtocolEvents.PLAYER_READY_REQUEST, function(playerId, gameId){
        var game = runningGames[gameId];
        game.setPlayerReady( playerId );

        socket.emit( Const.ProtocolEvents.PLAYER_READY_RESPONSE, {gameId: game.id} );
        socket.broadcast.to( game.table.id ).emit( Const.ProtocolEvents.NOTIFY_PLAYER_READY, {gameId: game.id, player: player} );
    });

    //TODO: rifactor con funzioni per ricavare game, table ecc senza rifare ogni volta il giro in ogni evento
    socket.on(Const.ProtocolEvents.PLAY_CARD_REQUEST, function(playerId, gameId, cardId){
        var game = runningGames[gameId];;
        if ( game.getPlayerToActId() ===  playerId ){
            var cardPlayed = game.playCard( playerId, cardId );

            if ( cardPlayed ) {
                socket.emit( Const.ProtocolEvents.PLAY_CARD_RESPONSE, { cardId: cardId } );
                socket.broadcast.to( game.table.id ).emit( Const.ProtocolEvents.NOTIFY_PLAY_CARD, {gameId: game.id, playerId: player.id, card: cardPlayed} );
            } else {
                socket.emit( 'notifyError', { code: 1002, msg: 'Card is not playable' } );
            }
        } else {
            socket.emit( 'notifyError', { code: 1001, msg: 'Wait your turn' } );
        }
    });

    //TODO: handle disconnection
});

function attachGameHandlers(game){
    game.on(Const.Events.GAME_STARTED, function(gameId){
        console.log("started");

        game.removeAllListeners( Const.Events.GAME_STARTED );

        _.defer(function(){
            var table = rooms[game.roomId].tables[game.tableId];
            //io.to( testroomname ).emit( 'test', {} );
            io.to( table.id ).emit( 'notifyGameStarted', {gameId: gameId, players: table.players} );
        });
    });

    game.on(Const.Events.ROUND_NEW, function(dealerId){
        _.defer(function(){
            _.each(table1.players, function(element, index, list){
                //TODO: place dealer on client
                io.to( element.socketId ).emit( Const.ProtocolEvents.NOTIFY_NEW_ROUND, { holecards: element.holeCards, dealerId: dealerId } );
            });
        });
    });

    game.on( Const.Events.GAME_WAITING, function(player){
        _.defer(function(){
            io.to( roomName ).emit( Const.Events.NOTIFY_WAIT_PLAYER_ACTION, {playerId: player.id} );
        });
    } );

    game.on( Const.Events.TURN_ENDED, function(winnerId){
        _.defer(function(){
            io.to( roomName ).emit( Const.ProtocolEvents.NOTIFY_TURN_ENDED, {winnerId: winnerId} );
        });
    } );

    game.on( Const.Events.TURN_STARTED, function(turnId){
        _.defer(function(){
            io.to( roomName ).emit( Const.ProtocolEvents.NOTIFY_TURN_STARTED, {turnId: turnId} );
        });
    } );

    game.on( Const.Events.TURN_DRAW_CARDS, function(drawedCards){
        _.defer(function(){
            io.to( roomName ).emit( Const.ProtocolEvents.NOTIFY_DRAW_CARDS, {drawedCards: drawedCards} );
        });
    } );
}

//TODO: when a playcard arrives check that player is authorized to move
      /*
setInterval(function(){
    io.to( testroomname ).emit( 'test', {} );
}, 2000);
*/

http.listen(app.get('port'), function(){
    console.log('listening on *:5000');
});
