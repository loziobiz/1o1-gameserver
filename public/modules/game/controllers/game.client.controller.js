'use strict';

angular.module('game').controller('gameController', ['$scope', '$state', 'socketIoSrv', 'userSrv', 'gameSrv',
	function($scope, $state, socketIoSrv, userSrv, gameSrv) {

    if (!gameSrv.activeTableId) {
      $state.go('game.lobby');
    }

    $scope.user = userSrv.user;
    $scope.table = ( gameSrv.room.tables && gameSrv.room.tables[gameSrv.activeTableId] ) ? gameSrv.room.tables[gameSrv.activeTableId] : undefined;
    $scope.game = {};
    $scope.status = 'waitinguser';
    $scope.heronick = "hero";
    $scope.opponick = "opponent";
    $scope.herocards = {};
    $scope.oppocards = {};
    $scope.cardsLeft = 0;
    $scope.playerInActionId = '';
    $scope.roundScores = [];
    $scope.totalScores = {hero:0, oppo:0};

    $scope.setPlayersCards = function() {
      $scope.herocards = $scope.table.holeCards[userSrv.user.id];
      $scope.oppocards = $scope.table.holeCards[$scope.game.opponent.id];
    }

    $scope.sendReadyToPLay = function (gameId) {
      socketIoSrv.socket.emit('playerReadyToPlayRequest', userSrv.user.id, gameId);
    };

    $scope.$on('user.join', function (event) {
      $scope.table = gameSrv.room.tables[gameSrv.activeTableId];
    });

    $scope.$on('game.started', function (event, gameId) {
      console.log('GAME STARTED');
      $scope.game = gameSrv.games[gameId];
      $scope.status = 'readytostart';
    });

    $scope.$on('game.running', function (event, gameId) {
      console.log('GAME RUNNING');
      $scope.status = 'running';

      // sets player local nicknames (useful for scores)
      _.each($scope.table.players, function(player,id,list){
        if (player.id === $scope.user.id) {
          $scope.heronick = player.nickName;
        } else {
          $scope.opponick = player.nickName;
        }
      });
    });

    $scope.$on('game.resume', function (event, gameId) {
      console.log('GAME RESUME');

      $scope.status = 'running';
      $scope.table = gameSrv.room.tables[gameSrv.activeTableId];
      $scope.game = gameSrv.games[gameId];

      _.each($scope.game.roundScores, function(score, index, list){
        $scope.roundScores.push({
          hero: score[userSrv.user.id],
          oppo: score[$scope.game.opponent.id]
        });

        $scope.totalScores = {
          hero: $scope.totalScores.hero + score[userSrv.user.id],
          oppo: $scope.totalScores.oppo + score[$scope.game.opponent.id]
        }
      });

      $scope.cardsLeft = $scope.game.cardsLeft;
      $scope.setPlayersCards();
    });

    $scope.$on('round.new', function (event, data) {
      $scope.cardsLeft = data.cardsLeft;
      $scope.setPlayersCards();
    });

    $scope.$on('player.waitforaction', function (event, data) {
      $scope.game.canPlay = ( data.playerId === userSrv.user.id );
      $scope.playerInActionId = data.playerId;
    });

    $scope.$on('player.cardplayed', function (event, data) {
      delete $scope.herocards[data.cardId];
    });

    $scope.$on('opponent.cardplayed', function (event, data) {
      //$scope.oppocards[data.card.id] = data.card;
      delete $scope.oppocards[data.card.id];
    });

    $scope.$on('turn.ended', function (event, data) {
      _.delay(function(){
        $('.move').empty();
      }, 1200);
    });

    $scope.$on('turn.drawcards', function (event, data) {
      $scope.cardsLeft = data.cardsLeft;

      $scope.setPlayersCards();
    });

    $scope.$on('round.ended', function (event, data) {
      var heroRoundScore = data.roundScore[userSrv.user.id]
        , oppoRoundScore = data.roundScore[$scope.game.opponent.id]
        , heroTotalScore = data.roundScore[userSrv.user.id]
        , oppoTotalScore = data.roundScore[$scope.game.opponent.id];

      $scope.roundScores.push({hero: heroRoundScore, oppo: oppoRoundScore});
      $scope.totalScores = {hero: $scope.totalScores.hero+heroTotalScore, oppo: $scope.totalScores.oppo+oppoTotalScore};

      //alert( "ROUND ENDED!\nYour score: " + heroRoundScore + " - Your opponent score: " + oppoRoundScore + "\nClick OK to continue the game.");
    });

    $scope.$on('game.ended', function (event, data) {
      var heroScore = data.scores[userSrv.user.id],
        villainScore = data.scores[$scope.game.opponent.id];

      if (heroScore > villainScore){
        alert( "GAME ENDED!\nGOOD JOB! You win: " + heroScore + " to " + villainScore + "\nClick OK to continue the game.");
      } else {
        alert( "GAME ENDED!\nYou loose: " + villainScore + " to " + heroScore + "\nClick OK to continue the game.");
      }

      //alert( "GAME ENDED!\nYour score: " + heroScore + " - Your opponent score: " + villainScore + "\nClick OK to continue the game.");
    });

    $scope.$on('game.suspended', function (event, data) {
      switch (data.reason){
        case 'PLAYER_DISCONNECTION':
          //alert( "GAME SUSPENDED FOR PLAYER DISCONNECTION" );

          //TODO: SHOW DISCONNECTION ON PLAYER PLACEHOLDER
          break;
      }
    });
	}
]);
