'use strict';

angular.module('game').controller('lobbyController', ['$scope', 'socketIoSrv', 'gameSrv', 'userSrv',
	function($scope, socketIoSrv, gameSrv, userSrv) {
    $scope.room = gameSrv.room;

    $scope.joinTable = function(tableId){
      socketIoSrv.socket.emit('playerJoinRequest', userSrv.user.id, 'tresette', tableId );
    };

    $scope.$on('room.data.received', function (event, data) {
      $scope.room = gameSrv.room;
    });
	}
]);
