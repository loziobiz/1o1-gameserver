/**
 * Created by alessandrobisi on 06/12/14.
 */

var Card = require('./card'),
    _ = require('underscore');

function createDeck(cards) {
    var deck = [];

    for ( var i= 0,l=cards.fronts.length; i<l; i++){
        for ( var j=0,l2=cards.suits.length; j<l2; j++){
            deck.push( new Card( cards.fronts[i] + cards.suits[j] ) );
        }
    }

    return deck;
}
exports.createDeck = createDeck;

function shuffleDeck( deck ) {
    return _.shuffle( deck );
}
exports.shuffleDeck = createDeck;

function getShuffledDeck(cards) {
    var _deck = createDeck( cards );

    return shuffleDeck( _deck );
}
exports.getShuffledDeck = getShuffledDeck;
