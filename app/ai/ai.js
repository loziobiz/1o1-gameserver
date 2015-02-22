/**
 * Created by alessandrobisi on 03/12/14.
 */

'use strict';

var _ = require('underscore');

var getPlayableCards = function (playerCards, turn) {
  var masterSuit = ( turn.cardsPlayed.length > 0 ) ? turn.cardsPlayed[0].cardPlayed.suit : undefined,
      playableCards = {};

  _.each(playerCards, function (card, key, list) {
    if (( masterSuit === undefined || card.suit === masterSuit )) {
      playableCards[key] = card ;
    }
  });

  if (_.size(playableCards) === 0) {
    playableCards = playerCards;
  }

  return playableCards;
};
exports.getPlayableCards = getPlayableCards;


var getFirstPlayableCard = function (playerCards, turn) {
  var playableCards = getPlayableCards(playerCards, turn),
      playableCardsIds = _.pluck(playableCards, 'id'),
      retval = playableCards[playableCardsIds[0]];

  return retval;
};
exports.getFirstPlayableCard = getFirstPlayableCard;


var getBestPlayableCard = function (playerCards, turns) {
  return getFirstPlayableCard(playerCards, turns[turns.length - 1]);
};
exports.getBestPlayableCard = getBestPlayableCard;
