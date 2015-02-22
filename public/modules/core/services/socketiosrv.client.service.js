'use strict';

angular.module('core').factory('socketIoSrv', ['socketFactory', 'Authentication',
	function(socketFactory, Authentication) {
    var Service = {};

    var _ioSocket = io.connect('http://localhost:3000');

    var socket = socketFactory({
      ioSocket: _ioSocket
    });

    socket.forward('socket_connection_response');
    socket.forward('playerConnectResponse');
    socket.forward('error');

    if (Authentication.user !== "") {
      var data = {
        playerNickname: Authentication.user.displayName,
        playerId: Authentication.user._id,
        roomId: 'tresette'
      };

      socket.emit('playerConnectRequest', data);
    }

    Service.socket = socket;

    return Service;
	}
]);
