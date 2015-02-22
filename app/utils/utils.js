/**
 * Created by alessandrobisi on 22/12/14.
 */

'use strict';

var _ = require('underscore');

var hideCardsButPlayer = function (tableHoleCards, myPlayerId) {
  var _tableHoleCards = JSON.parse(JSON.stringify(tableHoleCards));

  _.each(_tableHoleCards, function(player, id, list){
    if (id !== myPlayerId){
      _.each(player, function(card, index,list){
        card.comboValue = 'x';
        card.suit = 'x';
        card.front = 'x';
      });
    }
  });

  return _tableHoleCards;
};
exports.hideCardsButPlayer = hideCardsButPlayer;
