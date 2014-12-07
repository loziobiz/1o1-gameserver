/**
 * Created by alessandrobisi on 29/11/14.
 */
'use strict';

var Turn = require( './turn' ),
    Const = require('./const'),
    _ = require('underscore'),
    events = require('events'),
    UUIDGen = require('./uuidgen'),
    ai = require('./ai'),
    deck = require('./deck');

var id = UUIDGen.uuidFast();
var config = {};
var scores = {};
var table = {};
var rounds = [];


var eventDispatcher = function(){
    var EventDispatcher = function(){
        events.EventEmitter.call(this);
    }
    EventDispatcher.prototype.__proto__ = events.EventEmitter.prototype;

    return new EventDispatcher();
}();


function getCardIndexById(cardsArray, cardId){
    var i = cardsArray.length;

    while (i--){
        if ( cardId === cardsArray[i].id ){
            return i;
        }
    }

    return -1;
}

function getCardById(cardsArray, cardId){
    var i = cardsArray.length;

    while (i--){
        if ( cardId === cardsArray[i].id ) return cardsArray[i];
    }
}

function onTableChangeStatus(newStatus){
    if ( newStatus === Const.TableStatus.PLAYING ){
        start();
    }
}

function onTurnChangeStatus(oldStatus, newStatus){
    var that = this;

    switch (newStatus){
        case Const.TurnStatus.DRAW_CARDS:
            var i = this.table.players.length,
                index = 0;

            console.log( '[Game] [ ' + table.deck.length + ' ] cards left in deck' );

            _.defer(function(){
                eventDispatcher.emit( Const.Events.TURN_DRAW_CARDS, that.drawedCards );
            });

            _.delay(function(){
                that.setStatus( Const.TurnStatus.IDLE );
            }, 100);


            break;

        case Const.TurnStatus.IDLE:
        case Const.TurnStatus.WAITING:
            _.defer(function(){
                eventDispatcher.emit( Const.Events.GAME_WAITING, that.playerToAct );
            });

            break;

        case Const.TurnStatus.ENDED:
            this.removeAllListeners( Const.Events.TURN_CHANGE_STATUS );

            _.defer(function(){
                eventDispatcher.emit( Const.Events.TURN_ENDED, that.winnerId );
            });

            _.delay(function(){
                if ( that.isLastTurn() ){
                    endRound( that.round );
                } else {
                    newTurn();
                }
            }, 10);

            break;
    }
}

function onTurnStarted(){
    this.removeAllListeners( Const.Events.TURN_STARTED );

    var that = this;

    _.defer(function(){
        eventDispatcher.emit( Const.Events.TURN_STARTED, that.id );
    });
}

function calculateRoundScores(round) {
    var _scores = {},
        _points = {},
        _lastTurnWinnerId = round.turns[round.turns.length-1].winnerId;

    _.each(table.players, function(element, index, list){
        _scores[element.id] = 0;
        _points[element.id] = [];
    });

    _.each(_scores, function(value, key, list){
        var _playerWins = _.where(round.turns, {winnerId: key}),
            _playerPluck = _.pluck(_playerWins, 'cardsPlayed'),
            _i = _playerPluck.length,
            _j = 0,
            _score = 0;

        while(_i--){
            _j = _playerPluck[_i].length;

            while(_j--){
                _score = _playerPluck[_i][_j].cardPlayed.getNumericValue();
                _points[key].push(_playerPluck[_i][_j].cardPlayed.comboValue)
                value += _score;
            }
        }
        value = Math.floor(value);

        _scores[key] = value;
    });

    //Add "rete" special point
    _scores[_lastTurnWinnerId]++;

    //Save scores
    round.scores = _scores;
};

function endRound(round){
    var targetScoreReached = false;

    calculateRoundScores(round);

    _.each(round.scores, function(value, key, list){
        scores[key] = ( scores[key] && scores[key] > 0 ) ? scores[key] + value : value;
        if ( scores[key] >= config.targetScore ) targetScoreReached = true;
    });

    eventDispatcher.emit( Const.Events.ROUND_ENDED, round );

    if ( !targetScoreReached ) {
        newRound();
    } else {
        eventDispatcher.emit( Const.Events.GAME_ENDED );
    }
}


/**
 *
 * @param round
 */
function newTurn(round){
    console.log('[Game] >>>>> NEW TURN ---------------' );
    var _round = (round) ? round : getLastRound(),
        isFirstTurn = ( _round.turns.length > 0 ) ? false : true,
        lastWinnerId = ( _round.turns.length > 0 ) ? getLastTurn().winnerId : undefined,
        lastWinnerIdx = ( lastWinnerId !== undefined ) ? table.getPlayerIndexById( lastWinnerId) : undefined,
        turn = new Turn( table, getLastRound(), isFirstTurn, lastWinnerIdx );

    turn.on( Const.Events.TURN_CHANGE_STATUS, onTurnChangeStatus );
    turn.on( Const.Events.TURN_STARTED, onTurnStarted );

    _round.turns.push( turn );

    turn.start();
}

function newRound(){
    console.log('[Game] ========= NEW ROUND ============' );
    var round = {},
        dealSequence = [],
        player = undefined;

    /* Prepare deck */
    table.deck = deck.getShuffledDeck( config.cards );
    round.deck = table.deck;

    /* Generate id and set dealer index */
    round.id = UUIDGen.uuidFast();
    round.dealerIdx = getDealerIdx();
    round.dealerId = table.players[round.dealerIdx];

    /* Sets dealing sequence */
    for ( var i = round.dealerIdx; i < table.players.length; i++ ) dealSequence.push( i );
    for ( var i = 0; i < round.dealerIdx; i++ ) dealSequence.push( i );

    /* Deal cards for each player */
    for (var i=0; i<dealSequence.length; i++){
        player = table.players[dealSequence[i]];
        player.holeCards = table.getCardsFromDeck( config.startingCardsNumber );
        console.log('player ' + player.id + ' holecards: ' + player.getHoleCardsAsArray() );
    }

    /* Sets scores obj */
    round.scores = {};

    /* Set empty turns array and add round to rounds array */
    round.turns = [];
    rounds.push( round );

    _.defer(function(){
        eventDispatcher.emit( Const.Events.ROUND_NEW, id);
    });


    /* Starts new turn */
    newTurn( round );
}

function getDealerIdx() {
    var max = table.players.length - 1,
        randomnumber = Math.floor(Math.random() * (max - 0 + 1)) + 0,
        nRounds = rounds.length;

    if ( nRounds > 0 ) {
        var preDealerIdx = rounds[nRounds-1].dealerIdx;

        return ( preDealerIdx < nRounds-1 ) ? preDealerIdx++ : 0
    }

    return randomnumber;

}

function setTable(riftable){
    table = riftable;
    table.on( Const.Events.TABLE_CHANGE_STATUS, onTableChangeStatus );
}

function start(){
    console.log( '[Game] [start]' );
    eventDispatcher.emit( Const.Events.GAME_STARTED, id );

    /*
    server.sendMsg( [hero, villain], "GameStart", {} );

    server.sendMsg( [hero], "DrawCards", {cards: players[0].holeCards} );
    server.sendMsg( [villain], "DrawCards", {cards: players[1].holeCards} );
    */
}

function getLastTurn(){
    if ( !getLastRound() ) return undefined;

    var turns = getLastRound().turns;

    if ( turns.length === 0 ) return undefined;

    return turns[turns.length - 1];
}

function getLastRound(){
    if ( rounds.length === 0 ) return undefined;

    return rounds[rounds.length - 1];
}

var getCurrentTurn = getLastTurn;

function getTurnById(turnId){
    var turns = getLastRound().turns,
        i = turns.length;

    while( i-- ){
        if ( turns[i].id === turnId )
            return turns[i];
    }
}

function checkCardPlayable( playedCard, turn, playerCards ) {
    var playableCards = ai.getPlayableCards( playerCards, turn ),
        retval = false;

    _.each( playableCards, function(element, index, list){
        if ( element.id === playedCard.id ){
            retval = true;
        }
    } );

    return retval;
}

function playCard( playerId, cardId ){
    var player = table.getPlayerById( playerId );
    var cardIndex = getCardIndexById( player.holeCards, cardId );
    var currentTurn = getCurrentTurn();
    var playedCard = player.holeCards[cardIndex],
        cardIsPlayable = checkCardPlayable( playedCard, currentTurn, player.holeCards );    //TODO: fare checkCardPlayable compatta senza pescare sempre da getPlayableCards

    if ( cardIsPlayable ) {
        currentTurn.setCardPlayed( playerId, playedCard );
        player.holeCards.splice( cardIndex, 1 )[0];
        eventDispatcher.emit( Const.Events.CARD_PLAYED, playedCard ); //TODO: capire se è il caso di aspettare un evento da turn su cui triggerare questo

        return playedCard;
    } else {
        eventDispatcher.emit( Const.Events.CARD_NOT_PLAYABLE, playedCard );

        return false;
    }

    return false;
}

function checkGameCanStart(){
    var nplayers = table.players.length,
        i = nplayers,
        count = 0;

    while(i--){
        if ( table.players[i].readyToPlay ) count++;
    }

    if ( nplayers === count )
        newRound();
}

function setPlayerReady(playerId){
    table.getPlayerById(playerId).readyToPlay = true;

    checkGameCanStart();
}

function getPlayerToActId(){
    var lastTurn = getLastTurn();
    return lastTurn.playerToAct.id;
}

function Game(gameConfig){
    config = gameConfig;

    return{
        id: id,
        deck: deck,
        setTable: setTable,
        getLastTurn: getLastTurn,
        getLastRound: getLastRound,
        playCard: playCard,
        eventDispatcher: eventDispatcher,
        setPlayerReady: setPlayerReady,
        getPlayerToActId: getPlayerToActId
    }
}


module.exports = Game;