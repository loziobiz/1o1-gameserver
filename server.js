'use strict';

var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    _ = require('underscore'),
    Player = require( './player'),
    Const = require('./const'),
    PEvents = Const.ProtocolEvents,
    gameServerManager = require('./gameServerManager'),
    rooms = gameServerManager.rooms,
    games = gameServerManager.runningGames;


app.set('port', (process.env.PORT || 5000));

io.on('connection', function(socket){
    var player = {};
    gameServerManager.clients[socket.id] = socket;

    //TODO: add room list dispatch

    socket.on(PEvents.PLAYER_CONNECT_REQUEST, function(nickname, roomId){
        player = new Player();
        player.socketId = socket.id;
        player.nickName = nickname;
        rooms[roomId].addPlayer(player);

        socket.emit(
            PEvents.PLAYER_CONNECT_RESPONSE,
            {player: player.getData(), roomData: rooms[roomId].getData()}
        );

        console.log( 'player connected' );
    });

    socket.on(PEvents.PLAYER_JOIN_REQUEST, function(playerId, roomId, tableId){
        var table = rooms[roomId].tables[tableId],
            data = {
                table: table.getData(),
                player: player.getData()
            };

        socket.join( tableId );

        table.playerJoin( player );

        _.defer(function(){
            socket.emit( PEvents.PLAYER_JOIN_RESPONSE, data );

            socket.broadcast.to( tableId )
                .emit( PEvents.NOTIFY_PLAYER_JOIN, data );
        })
    });

    socket.on(PEvents.PLAYER_READY_REQUEST, function(playerId, gameId){
        var game = games[gameId],
            table = game.getTableObj();

        table.setPlayerReady( playerId );

        socket.emit( PEvents.PLAYER_READY_RESPONSE, {gameId: game.id} );

        socket.broadcast.to(table.id).
            emit(PEvents.NOTIFY_PLAYER_READY, {
                gameId: game.id,
                playerId: playerId
            } );

    });

    //TODO: refactor con funzioni per ricavare game, table ecc senza rifare ogni volta il giro in ogni evento
    socket.on(PEvents.PLAY_CARD_REQUEST, function(playerId, gameId, cardId){
        var game = games[gameId],
            playerToActId = game.getPlayerToActId(),
            data = {};

        if ( playerToActId ===  playerId ){
            var cardPlayed = game.playCard( playerId, cardId );

            if ( cardPlayed ) {
                data = {
                    gameId: game.id,
                    playerId: player.id,
                    card: cardPlayed
                };

                socket.emit( PEvents.PLAY_CARD_RESPONSE, { cardId: cardId } );

                socket.broadcast.to( game.getTableObj().id ).
                    emit( PEvents.NOTIFY_PLAY_CARD, data );

            } else {
                data = { code: 1002, msg: 'Card is not playable' };

                socket.emit( 'notifyError', data );
            }
        } else {
            socket.emit( 'notifyError', { code: 1001, msg: 'Wait your turn' } );
        }
    });

    //TODO: handle disconnection
});

gameServerManager.startServer(io);

/*
function attachGameHandlers(game){
    game.on(Events.GAME_STARTED, function(gameId){
        console.log("started");

        game.removeAllListeners( Events.GAME_STARTED );

        _.defer(function(){
            var table = rooms[game.roomId].tables[game.tableId],
                data = {game: game};

            //io.to( testroomname ).emit( 'test', {} );
            io.to( table.id ).emit( 'notifyGameStarted', data );
        });
    });

    game.on(Events.ROUND_NEW, function(dealerId){
        var data = {};

        _.defer(function(){
            _.each(table1.players, function(element, index, list){
                //TODO: place dealer on client
                data = {
                    holecards: element.holeCards,
                    dealerId: dealerId
                };

                io.to( element.socketId )
                    .emit( PEvents.NOTIFY_NEW_ROUND, data );
            });
        });
    });

    game.on(Events.GAME_WAITING, function(player){
        _.defer(function(){
            io.to( roomName )
                .emit( Events.NOTIFY_WAIT_PLAYER_ACTION, {playerId: player.id} );
        });
    });

    game.on(Events.TURN_ENDED, function(winnerId){
        _.defer(function(){
            io.to( roomName )
                .emit( PEvents.NOTIFY_TURN_ENDED, {winnerId: winnerId} );
        });
    });

    game.on(Events.TURN_STARTED, function(turnId){
        _.defer(function(){
            io.to( roomName )
                .emit( PEvents.NOTIFY_TURN_STARTED, {turnId: turnId} );
        });
    });

    game.on(Events.TURN_DRAW_CARDS, function(drawedCards){
        _.defer(function(){
            io.to( roomName )
                .emit( PEvents.NOTIFY_DRAW_CARDS, {drawedCards: drawedCards} );
        });
    });
}
*/


//TODO: when a playcard arrives check that player is authorized to move
      /*
setInterval(function(){
    io.to( testroomname ).emit( 'test', {} );
}, 2000);
*/

http.listen(app.get('port'), function(){
    console.log('listening on *:5000');
});
