'use strict';

angular.module('users').factory('userSrv', ['$rootScope', '$location', '$cookieStore', '$state', 'socketIoSrv', 'gameSrv',
	function($rootScope, $location, $cookieStore, $state, socketIoSrv, gameSrv) {
    var Service = {};

    Service.user = {};

    $rootScope.$on('socket:playerConnectResponse', function (ev, data) {
      console.log('playerConnectResponse: ' + JSON.stringify(data, null, 4));
      if (data.player && data.player.id) {
        $cookieStore.put('player', data.player);

        Service.user = data.player;


        //TODO: move this block in a better place
        socketIoSrv.socket.forward('table_create');
        socketIoSrv.socket.forward('table_update');
        socketIoSrv.socket.forward('playerJoinResponse');
        socketIoSrv.socket.forward('notifyPlayerJoin');
        socketIoSrv.socket.forward('notifyGameStarted');
        socketIoSrv.socket.forward('playerReadyToPlayResponse');
        socketIoSrv.socket.forward('notifyPlayerReadyToPlay');
        socketIoSrv.socket.forward('notifyNewRound');
        socketIoSrv.socket.forward('notifyTurnStarted');
        socketIoSrv.socket.forward('notifyWaitingForPlayerAction');
        socketIoSrv.socket.forward('playCardResponse');
        socketIoSrv.socket.forward('notifyPlayCard');
        socketIoSrv.socket.forward('notifyTurnEnded');
        socketIoSrv.socket.forward('notifyDrawCards');
        socketIoSrv.socket.forward('notifyRoundEnded');
        socketIoSrv.socket.forward('notifyGameEnded');
        socketIoSrv.socket.forward('notifyGameSuspended');
        socketIoSrv.socket.forward('notifyError');
        socketIoSrv.socket.forward('table_list_response');
        socketIoSrv.socket.forward('room_data_response');
        socketIoSrv.socket.forward('notify_player_connect');
        socketIoSrv.socket.forward('notify_player_disconnect');

        if (data.player && data.player.id) {
          gameSrv.room = data.roomData;
          $rootScope.$broadcast('room.data.received', data);

          if (data.activeTables){
            socketIoSrv.socket.emit('playerJoinRequest', Authentication.user._id, 'tresette', data.activeTables[0] );
          }
        }

        $rootScope.$broadcast('player.connected', data);

        $state.go('game.lobby');
      }

    });


    return Service;
	}
]);
