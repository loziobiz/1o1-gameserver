'use strict';

angular.module('game').factory('gameSrv', ['$rootScope', '$location', '$cookieStore', '$state', 'Authentication', 'socketIoSrv',
  function($rootScope, $location, $cookieStore, $state, Authentication, socketIoSrv) {
    var Service = {};
    Service.activeRoomId = undefined;
    Service.activeTableId = undefined;

    Service.room = {};
    Service.games = {};

    $rootScope.$on('$stateChangeStart',
      function(event, toState, toParams, fromState, fromParams){
        if (fromState.name === 'home' && toState.name !== 'signin' && Authentication.user === "") {
          event.preventDefault();
        }

        if (toState.name !== 'home' && Authentication.user === "") {
          $state.go('home');
        }
      }
    );

    $rootScope.$on('$viewContentLoading',
      function(event, viewConfig){
        console.log('');
      });

    function updateTable(tableId, table){
      if (!Service.room.tables[tableId]) {
        throw new Error("Table does not exists!", 1111);
      }

      if (!table.holeCards && Service.room.tables[tableId].holeCards){
        table.holeCards = Service.room.tables[tableId].holeCards;
      }

      Service.room.tables[tableId] = table;

      console.log("table " + tableId + " updated!");
    }

    function getTable(tableId){
      if (!Service.room.tables[tableId]) {
        throw new Error("Table does not exists!", 1111);
      }

      return Service.room.tables[tableId];
    }

    /*
    $rootScope.$on('player.connected', function (event, data) {
      if (data.player && data.player.id) {
        Service.room = data.roomData;
        $rootScope.$broadcast('room.data.received', data);

        if (data.activeTables){
          socketIoSrv.socket.emit('playerJoinRequest', Authentication.user._id, 'tresette', data.activeTables[0] );
        }
      }
    });
    */
    /*
    $rootScope.$on('socket:socket_connection_response', function (event, data) {
      console.log('socket_connection_response: ');

      var exPlayer = $cookieStore.get( 'player' );

      if ( exPlayer ){
        userSrv.connect( exPlayer.nickName, exPlayer.id );
      }
    });
    */

    $rootScope.$on('socket:table_create', function (ev, data) {
      console.log('table_create: ' + JSON.stringify(data, null, 4));

      updateTable(data.id, data);

      $rootScope.$broadcast('room.data.received', data);
    });

    $rootScope.$on('socket:table_update', function (ev, data) {
      console.log('table_update: ' + JSON.stringify(data, null, 4));

      updateTable(data.id, data);
      $rootScope.$broadcast('room.data.received', data);
    });

    $rootScope.$on('socket:playerJoinResponse', function (ev, data) {
      console.log('playerJoinResponse: ' + JSON.stringify(data, null, 4));

      updateTable(data.table.id, data.table);

      Service.activeTableId = data.table.id;

      if (data.gameObj){ //is rejoin
        var oppokeys = _.keys(data.opponents)
          , oppo = data.opponents[oppokeys[0]]
          , game = data.gameObj
          , player = data.player;

        if (game.currentTurn.cardsPlayed && game.currentTurn.cardsPlayed[0]) {
          var hasCardsPlayed = true
            , cardsPlayed = game.currentTurn.cardsPlayed;
        }

        if (hasCardsPlayed){
          var table = getTable(data.table.id)
            , cardPlayed = cardsPlayed[0].cardPlayed
            , cardPlayedData = {
              gameId: game.id,
              playerId: player.id,
              card: cardPlayed
            };

          table.holeCards[oppo.id][cardPlayed.id] = cardPlayed;
        }


        Service.games[game.id] = game;
        Service.games[game.id].opponent = oppo;

        _.delay(function () {
          $rootScope.$apply(function (scope) {
            scope.$broadcast('game.resume', game.id);
            scope.$broadcast('game.running', game.id);
          })
        }, 100);

        if (hasCardsPlayed){
          if (cardsPlayed[0].playerId !== player.id){
            _.delay(function () {
              $rootScope.$apply(function (scope) {
                $rootScope.$broadcast('opponent.cardplayed', cardPlayedData);
                $rootScope.$broadcast('player.waitforaction', {playerId: data.gameObj.currentTurn.playerToActId});
              });
            }, 400);
          }
        }
      }

      $state.go('game.table');

    });

    $rootScope.$on('socket:notifyPlayerJoin', function (ev, data) {
      console.log('notifyPlayerJoin: ' + JSON.stringify(data, null, 4));

      getTable(data.table.id).players = data.table.players;

      $rootScope.$broadcast('user.join', data);
    });

    $rootScope.$on('socket:notifyGameStarted', function (ev, data) {
      console.log('notifyGameStarted: ' + JSON.stringify(data, null, 4));
      var oppokeys = _.keys(data.opponents),
        oppo = data.opponents[oppokeys[0]];

      Service.games[data.game.id] = data.game;
      Service.games[data.game.id].opponent = oppo;

      _.delay(function () {
        $rootScope.$apply(function (scope) {
          scope.$broadcast('game.started', data.game.id);
        });
      }, 100);
    });

    $rootScope.$on('socket:notifyPlayerReadyToPlay', function (ev, data) {
      console.log('notifyPlayerReadyToPlay: ' + JSON.stringify(data, null, 4));
      Service.games[data.gameId].opponent.readyToPlay = true;
    });

    $rootScope.$on('socket:playerReadyToPlayResponse', function (ev, data) {
      console.log('playerReadyToPlayResponse: ' + JSON.stringify(data, null, 4));
      $rootScope.$broadcast('game.running', data.gameId);
    });

    $rootScope.$on('socket:notifyNewRound', function (ev, data) {
      console.log('notifyNewRound: ' + JSON.stringify(data, null, 4));

      getTable(data.table.id).holeCards = data.table.holeCards;

      $rootScope.$broadcast('round.new', data);
    });

    $rootScope.$on('socket:notifyWaitingForPlayerAction', function (ev, data) {
      console.log('notifyWaitingForPlayerAction: ' + JSON.stringify(data, null, 4));
      $rootScope.$broadcast('player.waitforaction', data);
    });

    $rootScope.$on('socket:playCardResponse', function (ev, data) {
      console.log('playCardResponse: ' + JSON.stringify(data, null, 4));
      $rootScope.$broadcast('player.cardplayed', data);
    });

    $rootScope.$on('socket:notifyPlayCard', function (ev, data) {
      console.log('notifyPlayCard: ' + JSON.stringify(data, null, 4));

      $rootScope.$broadcast('opponent.cardplayed', data);
    });

    $rootScope.$on('socket:notifyTurnEnded', function (ev, data) {
      console.log('notifyTurnEnded: ' + JSON.stringify(data, null, 4));
      $rootScope.$broadcast('turn.ended', data);
    });

    $rootScope.$on('socket:notifyTurnStarted', function (ev, data) {
      console.log('notifyTurnStarted: ' + JSON.stringify(data, null, 4));
    });

    $rootScope.$on('socket:notifyDrawCards', function (ev, data) {
      console.log('notifyDrawCards: ' + JSON.stringify(data, null, 4));

      _.delay(function(){
        $rootScope.$apply(function (scope) {
          _.each(data.drawedCards, function(card, key, list){
            getTable(Service.activeTableId).holeCards[key][card.id] = card;
            $rootScope.$broadcast('turn.drawcards', data);
          });
        });
      }, 1500);
    });

    $rootScope.$on('socket:notifyRoundEnded', function (ev, data) {
      console.log('notifyRoundEnded: ' + JSON.stringify(data, null, 4));
      $rootScope.$broadcast('round.ended', data);
    });

    $rootScope.$on('socket:notifyGameSuspended', function (ev, data) {
      console.log('notifyGameSuspended: ' + JSON.stringify(data, null, 4));
      $rootScope.$broadcast('game.suspended', data);
    });

    $rootScope.$on('socket:notifyGameEnded', function (ev, data) {
      console.log('notifyGameEnded: ' + JSON.stringify(data, null, 4));

      delete Service.games[data.id];
      $rootScope.$broadcast('game.ended', data);

      var ngames = _.size(Service.games);
      if (ngames === 0){
        _.delay(function(){
          $rootScope.$apply(function (scope) {
            $state.go('game.lobby');
          });
        }, 3000);
      }
    });

    $rootScope.$on('socket:notifyError', function (ev, data) {
      console.log('notifyError: ' + JSON.stringify(data, null, 4));
      alert(data.msg);
    });

    $rootScope.$on('socket:table_list_response', function (ev, data) {
      console.log('table_list_response: ' + JSON.stringify(data, null, 4));
    });

    $rootScope.$on('socket:room_data_response', function (ev, data) {
      console.log('room_data_response: ' + JSON.stringify(data, null, 4));

      Service.room = data.roomData;

      $rootScope.$broadcast('room.data.received', data);
    });

    return Service;
  }
]);
