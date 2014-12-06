/**
 * Created by alessandrobisi on 03/12/14.
 */

var _ = require('underscore');

var getPlayableCards = function(playerCards, turn){
    var masterSuit = ( turn.cardsPlayed.length > 0 ) ? turn.cardsPlayed[0].cardPlayed.suit : undefined,
        playableCards = [];

    _.each( playerCards, function(element, index, list){
        if ( ( masterSuit === undefined || element.suit === masterSuit ) ){
            playableCards.push( element );
        }
    } );

    if ( playableCards.length == 0 ) {
        playableCards = playerCards;
    }

    return playableCards;
}
exports.getPlayableCards = getPlayableCards;


var getFirstPlayableCard = function(playerCards, turn){
    return getPlayableCards( playerCards, turn )[0];
}
exports.getFirstPlayableCard = getFirstPlayableCard;


var getBestPlayableCard = function(playerCards, turns){
    return getFirstPlayableCard(playerCards, turns[turns.length - 1]);
}
exports.getBestPlayableCard = getBestPlayableCard;