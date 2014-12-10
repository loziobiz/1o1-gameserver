/**
 * Created by alessandrobisi on 29/11/14.
 */
'use strict';

var Turn = require( './turn' ),
    Const = require('./const'),
    roomsManager = require('./roomsManager'),
    rooms = roomsManager.rooms,
    _ = require('underscore'),
    events = require('events'),
    UUIDGen = require('./uuidgen'),
    ai = require('./ai'),
    deck = require('./deck');


module.exports = Game;

function Game(gameConfig){
    events.EventEmitter.call(this);

    this.id = UUIDGen.uuidFast();
    this.config = gameConfig;
    this.scores = {};
    this.rounds = [];
    this.tableId = undefined;
    this.roomId = undefined;
}
Game.prototype.__proto__ = events.EventEmitter.prototype;

Game.prototype.getTableObj = function(){
    return rooms[this.roomId].tables[this.tableId];
}

Game.prototype.getCardIndexById = function(cardsArray, cardId){
    var i = cardsArray.length;

    while (i--){
        if ( cardId === cardsArray[i].id ){
            return i;
        }
    }

    return -1;
}

Game.prototype.getCardById = function(cardsArray, cardId){
    var i = cardsArray.length;

    while (i--){
        if ( cardId === cardsArray[i].id ) return cardsArray[i];
    }
}

Game.prototype.onTurnChangeStatus = function(oldStatus, newStatus){
    var that = this;

    switch (newStatus){
        case Const.TurnStatus.DRAW_CARDS:
            console.log( '[Game] [ ' + this.getTableObj().deck.length + ' ] cards left in deck' );

            _.defer(function(){
                that.emit( Const.Events.TURN_DRAW_CARDS, that.drawedCards );
            });

            _.delay(function(){
                that.setStatus( Const.TurnStatus.IDLE );
            }, 100);


            break;

        case Const.TurnStatus.IDLE:
        case Const.TurnStatus.WAITING:
            _.defer(function(){
                that.emit( Const.Events.GAME_WAITING, that.playerToAct );
            });

            break;

        case Const.TurnStatus.ENDED:
            this.removeAllListeners( Const.Events.TURN_CHANGE_STATUS );

            _.defer(function(){
                that.emit( Const.Events.TURN_ENDED, that.winnerId );
            });

            _.delay(function(){
                if ( that.isLastTurn() ){
                    that.endRound( that.round );
                } else {
                    that.newTurn();
                }
            }, 10);

            break;
    }
}

Game.prototype.onTurnStarted = function(){
    this.removeAllListeners( Const.Events.TURN_STARTED );

    var that = this;

    _.defer(function(){
        that.emit( Const.Events.TURN_STARTED, that.id );
    });
}

Game.prototype.calculateRoundScores = function(round) {
    var _scores = {},
        _points = {},
        _lastTurnWinnerId = round.turns[round.turns.length-1].winnerId;

    _.each(this.getTableObj().players, function(element, index, list){
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

Game.prototype.endRound = function(round){
    var targetScoreReached = false,
        that = this;

    this.calculateRoundScores(round);

    _.each(round.scores, function(value, key, list){
        that.scores[key] = ( that.scores[key] && that.scores[key] > 0 ) ? that.scores[key] + value : value;
        if ( that.scores[key] >= config.targetScore ) targetScoreReached = true;
    });

    that.emit( Const.Events.ROUND_ENDED, round );

    if ( !targetScoreReached ) {
        that.newRound();
    } else {
        that.emit( Const.Events.GAME_ENDED );
    }
}


/**
 *
 * @param round
 */
Game.prototype.newTurn = function(round){
    console.log('[Game] >>>>> NEW TURN ---------------' );
    var _round = (round) ? round : this.getLastRound(),
        isFirstTurn = ( _round.turns.length > 0 ) ? false : true,
        lastWinnerId = ( _round.turns.length > 0 )
            ? this.getLastTurn().winnerId
            : undefined,
        turn = new Turn( this, this.getLastRound(), isFirstTurn, lastWinnerId );

    turn.on( Const.Events.TURN_CHANGE_STATUS, this.onTurnChangeStatus );
    turn.on( Const.Events.TURN_STARTED, this.onTurnStarted );

    _round.turns.push( turn );

    turn.start();
}

Game.prototype.newRound = function(){
    console.log('[Game] ========= NEW ROUND ============' );
    var round = {},
        dealSequence = [],
        player = undefined,
        that = this,
        table = this.getTableObj(),
        playerIds = _.keys(table.players),
        playersNum = playerIds.length,
        cards = require('./deckTypes')[this.config.deckType];

    /* Prepare deck */
    table.deck = deck.getShuffledDeck( cards );
    round.deck = table.deck;

    /* Generate id and set dealer index */
    round.id = UUIDGen.uuidFast();
    round.dealerIdx = this.getDealerIdx();
    round.dealerId = table.players[round.dealerIdx];

    /* Sets dealing sequence */
    for ( var i = round.dealerIdx; i < playersNum; i++ ) dealSequence.push( playerIds[i] );
    for ( var i = 0; i < round.dealerIdx; i++ ) dealSequence.push( playerIds[i] );

    /* Deal cards for each player */
    for (var i=0; i<dealSequence.length; i++){
        player = table.players[dealSequence[i]];
        player.holeCards = table.getCardsFromDeck( this.config.startingCardsNumber );
        console.log('player ' + player.id + ' holecards: ' + player.getHoleCardsAsArray() );
    }

    /* Sets scores obj */
    round.scores = {};

    /* Set empty turns array and add round to rounds array */
    round.turns = [];
    this.rounds.push( round );

    _.defer(function(){
        that.emit( Const.Events.ROUND_NEW, round.dealerId);
    });

    /* Starts new turn */
    this.newTurn( round );
}

Game.prototype.getDealerIdx = function() {
    var playersIdArray = _.keys(this.getTableObj().players),
        max = playersIdArray.length - 1,
        randomnumber = Math.floor(Math.random() * (max - 0 + 1)) + 0,
        nRounds = this.rounds.length,
        dealerIdx = 0,
        preDealerIdx = 0;

    if ( nRounds > 0 ) {
        preDealerIdx = this.rounds[nRounds-1].dealerIdx;
        dealerIdx = ( preDealerIdx < nRounds-1 ) ? preDealerIdx++ : 0;
    } else {
        dealerIdx = randomnumber;
    }

    return dealerIdx;

}

Game.prototype.startServer = function(){
    console.log( '[Game] [start]' );

    var that = this;

    _.defer(function(){
        that.emit( Const.Events.GAME_STARTED, that.id );
    });


    /*
    server.sendMsg( [hero, villain], "GameStart", {} );

    server.sendMsg( [hero], "DrawCards", {cards: players[0].holeCards} );
    server.sendMsg( [villain], "DrawCards", {cards: players[1].holeCards} );
    */
}

Game.prototype.getLastTurn = function(){
    if ( !this.getLastRound() ) return undefined;

    var turns = this.getLastRound().turns;

    if ( turns.length === 0 ) return undefined;

    return turns[turns.length - 1];
}

Game.prototype.getLastRound = function(){
    if ( this.rounds.length === 0 ) return undefined;

    return this.rounds[this.rounds.length - 1];
}

Game.prototype.getCurrentTurn = function(){
    return this.getLastTurn();
}

Game.prototype.getTurnById = function(turnId){
    var turns = this.getLastRound().turns,
        i = turns.length;

    while( i-- ){
        if ( turns[i].id === turnId )
            return turns[i];
    }
}

Game.prototype.checkCardPlayable = function( playedCard, turn, playerCards ) {
    var playableCards = ai.getPlayableCards( playerCards, turn ),
        retval = false;

    _.each( playableCards, function(element, index, list){
        if ( element.id === playedCard.id ){
            retval = true;
        }
    } );

    return retval;
}

Game.prototype.playCard = function( playerId, cardId ){
    var that = this;
    var player = this.getTableObj().getPlayerById( playerId );
    var cardIndex = that.getCardIndexById( player.holeCards, cardId );
    var currentTurn = that.getCurrentTurn();
    var playedCard = player.holeCards[cardIndex],
        cardIsPlayable = that.checkCardPlayable( playedCard, currentTurn, player.holeCards );    //TODO: fare checkCardPlayable compatta senza pescare sempre da getPlayableCards

    if ( cardIsPlayable ) {
        currentTurn.setCardPlayed( playerId, playedCard );
        player.holeCards.splice( cardIndex, 1 )[0];
        that.emit( Const.Events.CARD_PLAYED, playedCard ); //TODO: capire se è il caso di aspettare un evento da turn su cui triggerare questo

        return playedCard;
    } else {
        that.emit( Const.Events.CARD_NOT_PLAYABLE, playedCard );

        return false;
    }

    return false;
}

Game.prototype.checkGameCanStart = function(){
    var table = this.getTableObj(),
        nplayers = table.players.length,
        i = nplayers,
        count = 0;

    while(i--){
        if ( table.players[i].readyToPlay ) count++;
    }

    if ( nplayers === count )
        this.newRound();
}

Game.prototype.getPlayerToActId = function(){
    var lastTurn = this.getLastTurn();
    return lastTurn.playerToAct.id;
}

Game.prototype.getData = function(){
    return _.pick(this, 'id', 'tableId', 'roomId', 'config');
}

Game.prototype.getOpponents = function(heroId){
    var table = this.getTableObj(),
        opponents = _.omit(table.players, heroId);

    _.each(opponents, function(v,k,l){
        opponents[k] = _.omit(opponents[k].getData(), 'holeCards');
    })

    return opponents;
}
