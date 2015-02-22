'use strict';

angular.module('game').directive('card', ['userSrv', 'socketIoSrv',
	function(userSrv, socketIoSrv) {
    return {
      scope: {
        comboval: '@',
        cardid: '@',
        gameid: '@',
        player: '@'

      },
      restrict: "E",
      templateUrl: "modules/game/views/card.tpl.html",
      replace: true,
      link: function (scope, element, attributes) {
        if (scope.player !== "hero"){
          setTimeout(function(){
            $(element).removeClass().addClass( 'card cardx' );
          }, 2000);
        }

        $(element).click(function (event) {
          socketIoSrv.socket.
            emit('playCardRequest', userSrv.user.id, scope.gameid, scope.cardid)
        });

        scope.$on('player.cardplayed', function (event, data) {
          if (data.cardId === scope.cardid) {
            $(element).clone().appendTo('#heromove');
          }
        });

        scope.$on('opponent.cardplayed', function (event, data) {
          if (data.card.id === scope.cardid) {
            var jqEl = $(element);

            jqEl.removeClass( 'cardx' ).addClass( 'card' + data.card.comboValue );
            jqEl.attr( 'comboval', data.card.comboValue );

            jqEl.clone().appendTo('#oppomove');
          }
        });
      }
    };
	}
]);
