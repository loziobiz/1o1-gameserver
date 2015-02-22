/**
 * Created by alessandrobisi on 09/12/14.
 */

'use strict';

var _ = require('underscore'),
    Room = require('../obj/room'),
    roomsConfig = require('../conf/roomsConf'),
    roomsManager = require('./roomsManager'),
    rooms = roomsManager.rooms,
    Const = require('../conf/const'),
    Events = Const.Events,
    PEvents = Const.ProtocolEvents,
    Utils = require('../utils/utils');


var self = module.exports = {

  roomsManager: roomsManager,
  rooms: roomsManager.rooms,
  runningGames: {},
  clients: {},
  io: {},
  startServer: function (io) {
    self.io = io;

    _.each(roomsConfig, function (value, key, list) {
      roomsManager.addRoom(new Room(key, value)).
        on(Events.TABLE_START_PLAYING, function (table) {
          var game = self.runningGames[table.gameObj.id] = table.gameObj;
          self.attachGameHandlers(game);
        }).
        on(Events.TABLE_CREATE, function (table) {
          var data = this.tables[table.id].getData();
          self.io.emit(PEvents.TABLE_CREATE, data);
        }).
        on(Events.TABLE_UPDATE, function (table) {
          var data = this.tables[table.id].getData();
          self.io.emit(PEvents.TABLE_UPDATE, data);
          console.log();
        });
    });
  },
  attachGameHandlers: function (game) {
    game.on(Events.GAME_STARTED, function (gameId) {
      console.log('started');

      var table = game.getTableObj(),
        opponents = {},
        data = {};

      game.removeAllListeners(Events.GAME_STARTED);

      self.runningGames[game.id] = game;

      _.defer(function () {
        _.each(table.players, function (value, key, list) {
          opponents = game.getOpponents(value.id);
          data = {
            game: game.getData(),
            opponents: opponents
          };

          self.io.to(value.socketId).emit(PEvents.NOTIFY_GAME_STARTED, data);
        });
      });
    });

    game.on(Events.ROUND_NEW, function (dealerId) {
      var table = game.getTableObj()
        , data = {};

      _.defer(function () {
        _.each(table.players, function (player, index, list) {
          //TODO: place dealer on client
          data = {
            gameId: game.id,
            table: table.getData(player.id),
            dealerId: dealerId,
            cardsLeft: table.deck.length
          };

          self.io.to(player.socketId).emit(PEvents.NOTIFY_NEW_ROUND, data);
        });
      });
    });

    game.on(Events.TURN_STARTED, function (turnId) {
      var table = game.getTableObj(),
        tableId = table.id;

      _.defer(function () {
        self.io.to(tableId).
          emit(PEvents.NOTIFY_TURN_STARTED, {turnId: turnId, gameId: game.id});
      });
    });

    game.on(Events.TURN_ENDED, function (winnerId) {
      var table = game.getTableObj(),
        tableId = table.id;

      _.defer(function () {
        self.io.to(tableId).
          emit(PEvents.NOTIFY_TURN_ENDED, {winnerId: winnerId});
      });
    });

    game.on(Events.TURN_DRAW_CARDS, function (drawedCards) {
      var table = game.getTableObj(),
        tableId = table.id;

      _.defer(function () {
        self.io.to(tableId).
          emit(PEvents.NOTIFY_DRAW_CARDS, {drawedCards: drawedCards, cardsLeft: table.deck.length});
      });
    });

    game.on(Events.GAME_WAITING, function (playerId) {
      var table = game.getTableObj(),
          tableId = table.id;

      _.defer(function () {
        self.io.to(tableId).
          emit(PEvents.NOTIFY_WAIT_PLAYER_ACTION, {playerId: playerId});
      });
    });

    game.on(Events.ROUND_ENDED, function (round) {
      var tableId = game.getTableObj().id,
          data = {
            roundScore: round.scores,
            gameScore: game.scores
          };

      _.defer(function () {
        self.io.to(tableId).
          emit(PEvents.NOTIFY_ROUND_ENDED, data);
      });
    });

    game.on(Events.GAME_ENDED, function () {
      var tableId = game.getTableObj().id
        , gameData = game.getData();

      console.log();

      _.defer(function () {
        self.io.to(tableId).
          emit(PEvents.NOTIFY_GAME_ENDED, gameData);
      });
    });

    game.on(Events.GAME_SUSPENDED, function (reason) {
      var tableId = game.getTableObj().id
        , data = {
            gameData: game.getData(),
            reason: reason
        };

      _.defer(function () {
        self.io.to(tableId).
          emit(PEvents.NOTIFY_GAME_SUSPENDED, data);
      });
    });
  }
};
