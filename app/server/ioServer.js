'use strict';

/**
 * Module dependencies.
 */
var io = require('socket.io')
  , _ = require('underscore')
  , Player = require('../obj/player')
  , Const = require('../conf/const')
  , Utils = require('../utils/utils')
  , PEvents = Const.ProtocolEvents
  , gameServerManager = require('../server/gameServerManager')
  , rooms = gameServerManager.rooms
  , games = gameServerManager.runningGames;


exports.createIoServer = function(httpServer){
  var ioServer = io(httpServer);

  ioServer.on('connection', function (socket) {
    var player = {}
      , room
      , roomData
      , activeTables;

    gameServerManager.clients[socket.id] = socket;

    socket.emit(
      PEvents.SOCKET_CONNECTION_RESPONSE
    );

    //TODO: add room list dispatch

    socket.on(PEvents.PLAYER_CONNECT_REQUEST, function (data) {
      player = new Player(data.playerId);
      player.socketId = socket.id;
      player.nickName = data.playerNickname;
      room = rooms[data.roomId];
      room.addPlayer(player);
      roomData = room.getData(player.id);

      console.log('player connected');

      if ( data.playerId ){
        activeTables = undefined;

        _.each(room.tables, function(table, key, list){
          if ( table.redemptionList && table.redemptionList[player.id] ){
            activeTables = activeTables || [];
            activeTables.push(table.id);
          }
        });
      }

      socket.emit(
        PEvents.PLAYER_CONNECT_RESPONSE,
        {player: player.getData(), roomData: roomData, activeTables: activeTables}
      );
    });

    socket.on(PEvents.PLAYER_JOIN_REQUEST, function (playerId, roomId, tableId) {
      var table = rooms[roomId].tables[tableId]
        , data = {
          player: player.getData()
        };

      socket.join(tableId);

      if ( table.redemptionList && table.redemptionList[playerId] ){
        data.gameObj = table.gameObj.getRejoinData();
        data.gameObj.currentTurn = table.gameObj.getLastTurn().getRejoinData();
        data.gameObj.cardsLeft = table.deck.length;
        data.opponents = table.gameObj.getOpponents(playerId);
      }

      table.playerJoin(player);

      data.table = table.getData(playerId);

      _.defer(function () {
        socket.emit(PEvents.PLAYER_JOIN_RESPONSE, data);

        socket.broadcast.to(tableId)
          .emit(PEvents.NOTIFY_PLAYER_JOIN, data);
      });
    });

    socket.on(PEvents.PLAYER_READY_REQUEST, function (playerId, gameId) {
      var game = games[gameId],
        table = game.getTableObj();

      table.setPlayerReady(playerId);

      socket.emit(PEvents.PLAYER_READY_RESPONSE, {gameId: game.id});

      socket.broadcast.to(table.id).
        emit(PEvents.NOTIFY_PLAYER_READY, {
          gameId: game.id,
          playerId: playerId
        });

    });

    socket.on(PEvents.TABLE_LIST_REQUEST, function (playerId, roomId) {
      var room = rooms[roomId]
        , tables = room.tables;

      socket.emit(PEvents.TABLE_LIST_RESPONSE, {tables: tables});
    });

    socket.on(PEvents.ROOM_DATA_REQUEST, function (playerId, roomId) {
      var room = rooms[roomId]
        , roomData = room.getData();

      //socket.emit(PEvents.PLAY_CARD_RESPONSE, {roomData: roomData});
    });

    //TODO: refactor con funzioni per ricavare game, table ecc senza rifare ogni volta il giro in ogni evento
    socket.on(PEvents.PLAY_CARD_REQUEST, function (playerId, gameId, cardId) {
      var game = games[gameId],
        playerToActId = game.getPlayerToActId(),
        data = {};

      if (playerToActId === playerId) {
        var cardPlayed = game.playCard(playerId, cardId);

        if (cardPlayed) {
          data = {
            gameId: game.id,
            playerId: player.id,
            card: cardPlayed
          };

          socket.emit(PEvents.PLAY_CARD_RESPONSE, {cardId: cardId});

          socket.broadcast.to(game.getTableObj().id).
            emit(PEvents.NOTIFY_PLAY_CARD, data);

        } else {
          data = {code: 1002, msg: 'Card is not playable'};

          socket.emit('notifyError', data);
        }
      } else {
        socket.emit('notifyError', {code: 1001, msg: 'Wait your turn'});
      }
    });

    socket.on('disconnect', function () {
      if ( room )
        room.removePlayer( player.id );

      player = undefined;
      room = undefined;
      roomData = undefined;

    });

    //TODO: handle disconnection
  });

  gameServerManager.startServer(ioServer);

  return ioServer;
};
