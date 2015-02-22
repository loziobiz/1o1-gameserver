'use strict';

//Setting up route
angular.module('game').config(['$stateProvider',
  function($stateProvider) {
    // Lobby state routing
    $stateProvider.
      state('game',{
        abstract: true,
        url: '/game',
        template: '<ui-view/>',
        controller: function($scope, $state, Authentication){
          if (Authentication.user === '') {
            $state.go('home');
          }
        }
      }).
      state('game.table', {
        url: '/table',
        templateUrl: 'modules/game/views/game.client.view.html'
      }).
      state('game.lobby', {
        url: '/lobby',
        templateUrl: 'modules/game/views/lobby.client.view.html'
      });
  }
]);
