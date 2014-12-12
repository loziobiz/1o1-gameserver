/**
 * Created by alessandrobisi on 09/12/14.
 */

var _ = require('underscore'),
    Room = require( './room'),
    roomsConfig = require('./roomsConf'),
    roomsManager = require('./roomsManager'),
    rooms = roomsManager.rooms,
    Const = require('./const'),
    Events = Const.Events,
    PEvents = Const.ProtocolEvents;


var self = module.exports = {
    roomsManager: roomsManager,
    rooms: roomsManager.rooms,
    runningGames: {},
    clients: {},
    io: {},
    startServer: function(io){
        self.io = io;

        _.each(roomsConfig, function(value, key, list){
            roomsManager.addRoom( new Room( key, value ) ).
                on(Events.TABLE_START_PLAYING, function(table){
                    var game = self.runningGames[table.gameObj.id] = table.gameObj;
                    self.attachGameHandlers( game );
                } );
        });
    },
    attachGameHandlers: function(game){
        game.on(Events.GAME_STARTED, function(gameId){
            console.log("started");

            var table = game.getTableObj().getData(),
                opponents = {},
                data = {};

            game.removeAllListeners( Events.GAME_STARTED );

            self.runningGames[game.id] = game;

            _.defer(function(){
                _.each(table.players, function(value, key, list){
                    opponents = game.getOpponents(value.id),
                    data = {
                        game: game.getData(),
                        opponents: opponents
                    };

                    self.io.to( value.socketId ).
                        emit( 'notifyGameStarted', data );
                });
            });
        });

        game.on(Events.ROUND_NEW, function(dealerId){
            var table = game.getTableObj().getData(),
                data = {};

            _.defer(function(){
                _.each(table.players, function(element, index, list){
                    //TODO: place dealer on client
                    data = {
                        gameId: game.id,
                        holecards: element.holeCards,
                        dealerId: dealerId
                    };

                    self.io.to( element.socketId ).
                        emit( PEvents.NOTIFY_NEW_ROUND, data );
                });
            });
        });

        game.on(Events.TURN_STARTED, function(turnId){
            var table = game.getTableObj(),
                tableId = table.id;

            _.defer(function(){
                self.io.to( tableId ).
                    emit( PEvents.NOTIFY_TURN_STARTED, {turnId: turnId, gameId: game.id} );
            });
        });

        game.on(Events.TURN_ENDED, function(winnerId){
            var table = game.getTableObj(),
                tableId = table.id;

            _.defer(function(){
                self.io.to( tableId ).
                    emit( PEvents.NOTIFY_TURN_ENDED, {winnerId: winnerId} );
            });
        });

        game.on(Events.TURN_DRAW_CARDS, function(drawedCards){
            var table = game.getTableObj(),
                tableId = table.id;

            _.defer(function(){
                self.io.to( tableId ).
                    emit( PEvents.NOTIFY_DRAW_CARDS, {drawedCards: drawedCards} );
            });
        });

        game.on(Events.GAME_WAITING, function(playerId){
            var table = game.getTableObj(),
                tableId = table.id;

            _.defer(function(){
                self.io.to( tableId ).
                    emit( PEvents.NOTIFY_WAIT_PLAYER_ACTION, {playerId: playerId} );
            });
        });
    }
}