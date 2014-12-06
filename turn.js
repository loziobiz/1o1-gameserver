/**
 * Created by alessandrobisi on 30/11/14.
 */

'use strict';

var events = require('events'),
    EventConstants = require('./eventConstants'),
    _ = require('underscore'),
    UUIDGen = require('./uuidgen');

var Turn = function(table, round, isFirstTurn, previousWinnerIdx){
    events.EventEmitter.call(this);
    this.id = UUIDGen.uuidFast();
    this.table = table;
    this.roundId = round.id;
    this.round = round;
    this.status = 'empty'; // VALUES: 'empty', 'idle', 'wait', 'ended'
    this.cardsPlayed = []; // something like [ {playerId:id, cardPlayed:card, timestamp:time},... ]
    this.winnerId = undefined;
    this.playerToAct = undefined;
    this.playingSequence = [];
    this.drawedCards = {};
    this.isFirstTurn = isFirstTurn;
    this.previousWinnerIdx = previousWinnerIdx;

    this.emit( EventConstants.TURN_READY, this.id );
}
Turn.prototype.__proto__ = events.EventEmitter.prototype;



Turn.prototype.setStatus = function(newStatus){
    //console.log( '[Turn] [setStatus] newStatus: ' + newStatus );
    var oldStatus = this.status;
    var that = this;
    this.status = newStatus;

    switch (newStatus){
        case 'draw_new_cards':
            var l = this.table.players.length,
                index = 0;

            var drawedCards = this.table.getCardsFromDeck( this.table.players.length );

            for ( var i=0; i < l; i++){
                index = this.playingSequence[i];
                this.drawedCards[this.table.players[index].id] = drawedCards[index]
                this.table.players[index].holeCards.push( drawedCards[index] );
                console.log( '[Turn] [ ' + drawedCards[index].comboValue + ' drawed to pleyer ' + this.table.players[index].id + ' ] holecards: ' + this.table.players[index].getHoleCardsAsArray() );
            }

            break;

        case 'idle':
        case 'waiting':
            this.playerToAct = this.table.players[this.playingSequence[0]];

            break;

        case 'ended':
            this.winnerId = this.getWinnerId();

            console.log('[Turn] [Winner is] player ' + this.winnerId );

            break;
    }

    _.delay(function(){
        that.emit( EventConstants.TURN_CHANGE_STATUS, oldStatus, newStatus );
    }, 10);

}

Turn.prototype.isLastTurn = function(){
    var totCardLeft = 0,
        i = this.table.players.length;

    while(i--){
        totCardLeft += this.table.players[i].holeCards.length;
    }

    if ( totCardLeft > 0 )
        return false
    else
        return true
}

Turn.prototype.getPlayingSequenceAsArray = function(){
    var sequence = [];

    var firstPlayerIndex = ( this.isFirstTurn ) ? this.round.dealerIdx : this.previousWinnerIdx;

    for ( var i = firstPlayerIndex; i < this.table.players.length; i++ ){
        sequence.push( i );
    }

    for ( var i = 0; i < firstPlayerIndex; i++ ){
        sequence.push( i );
    }

    return sequence;
}

Turn.prototype.getWinnerId = function(){
    var mastersuit = this.cardsPlayed[0].cardPlayed.suit,
        mastervalue = this.cardsPlayed[0].cardPlayed.getOrdinalValue(),
        playersuit = '',
        playervalue = 0,
        cardsSameSuit = [],
        len = this.cardsPlayed.length,
        winnerId = this.cardsPlayed[0].playerId,
        winner = undefined;

    for ( var i = 1; i < len; i++ ){
        playersuit =  this.cardsPlayed[i].cardPlayed.suit;
        playervalue = this.cardsPlayed[i].cardPlayed.getOrdinalValue();
        if ( playersuit === mastersuit && playervalue > mastervalue ){
            winnerId = this.cardsPlayed[i].playerId;
        }
    }

    //winner = this.table.getPlayerById(winnerId);

    return winnerId;
}

Turn.prototype.setCardPlayed = function(playerId, card){
    console.log('[Turn] [setCardPlayed] playerId: ' + playerId + ', card: ' + card.comboValue );
    this.cardsPlayed.push({
        playerId: playerId,
        cardPlayed: card,
        timestamp: new Date().getTime()
    });

    this.playingSequence.shift();

    if ( this.cardsPlayed.length > 0  && this.cardsPlayed.length < this.table.players.length ){
        this.setStatus( 'waiting' );
    }

    if (this.cardsPlayed.length === this.table.players.length ){
        this.setStatus( 'ended' );
    }
}

Turn.prototype.start = function(){
    this.playingSequence = this.getPlayingSequenceAsArray();

    this.emit( 'TURN_STARTED', this );

    if ( this.isFirstTurn || this.table.deck.length === 0 ){
        this.setStatus( 'idle' );
    } else {
        this.setStatus( 'draw_new_cards' );
    }

}

module.exports = Turn;