/**
 * Created by alessandrobisi on 30/11/14.
 */

'use strict';

var events = require('events'),
    Const = require('../conf/const'),
    _ = require('underscore'),
    UUIDGen = require('../utils/uuidgen');

function Turn(table, roundId, isFirstTurn, dealerIdx, previousWinnerId) {
  events.EventEmitter.call(this);
  this.id = UUIDGen.uuidFast();
  this.table = table;
  this.roundId = roundId;
  this.dealerIdx = dealerIdx;
  this.status = Const.TurnStatus.EMPTY; // VALUES: 'empty', 'idle', 'wait', 'ended'
  this.cardsPlayed = []; // something like [ {playerId:id, cardPlayed:card, timestamp:time},... ]
  this.winnerId = undefined;
  this.playerToActId = undefined;
  this.playingSequence = [];
  this.drawedCards = {};
  this.isFirstTurn = isFirstTurn;
  this.previousWinnerId = previousWinnerId;

  this.emit(Const.Events.TURN_READY, this.id);
}
module.exports = Turn;
Turn.prototype.__proto__ = events.EventEmitter.prototype;


Turn.prototype.setStatus = function (newStatus) {
  //console.log( '[Turn] [setStatus] newStatus: ' + newStatus );
  var oldStatus = this.status;
  var that = this;
  this.status = newStatus;

  switch (newStatus) {
    case Const.TurnStatus.DRAW_CARDS:
      var playerIds = _.keys(this.table.players),
        l = playerIds.length,
        playerId = 0,
        drawedCard = {};

      for (var i = 0; i < l; i++) {
        drawedCard = this.table.getCardsFromDeckAsArray(1)[0];
        playerId = this.playingSequence[i];
        this.drawedCards[playerId] = drawedCard;
        this.table.holeCards[playerId][drawedCard.id] = drawedCard;

        console.log('[Turn] [ ' + drawedCard.comboValue + ' drawed to player ' + playerId + ' ] holecards: ' + _.pluck( this.table.holeCards[playerId], 'comboValue'));
      }

      break;

    case Const.TurnStatus.IDLE:
    case Const.TurnStatus.WAITING:
      this.playerToActId = this.playingSequence[0];

      break;

    case Const.TurnStatus.ENDED:
      this.winnerId = this.getWinnerId();

      console.log('[Turn] [Winner is] player ' + this.winnerId);

      break;
  }

  _.delay(function () {
    that.emit(Const.Events.TURN_CHANGE_STATUS, oldStatus, newStatus);
  }, 10);

};

Turn.prototype.isLastTurn = function () {
  var totCardLeft = 0,
      playerIds = _.keys(this.table.players),
      i = playerIds.length;

  while (i--) {
    totCardLeft += _.size( this.table.holeCards[playerIds[i]] );
  }

  console.log('TOTCARDLEFT to players: ' + totCardLeft);
  if (totCardLeft > 0)
    return false;
  else
    return true;
};

Turn.prototype.getPlayingSequenceAsArray = function () {
  var sequence = [];
  var playerIds = _.keys(this.table.players);
  var firstPlayerIndex = ( this.isFirstTurn ) ? this.dealerIdx : _.indexOf(playerIds, this.previousWinnerId);
  var i;

  for (i = firstPlayerIndex; i < playerIds.length; i++) {
    sequence.push(playerIds[i]);
  }

  for (i = 0; i < firstPlayerIndex; i++) {
    sequence.push(playerIds[i]);
  }

  return sequence;
};

Turn.prototype.getWinnerId = function () {
  var mastersuit = this.cardsPlayed[0].cardPlayed.suit,
    mastervalue = this.cardsPlayed[0].cardPlayed.getOrdinalValue(),
    playersuit = '',
    playervalue = 0,
    cardsSameSuit = [],
    len = this.cardsPlayed.length,
    winnerId = this.cardsPlayed[0].playerId,
    winner;

  for (var i = 1; i < len; i++) {
    playersuit = this.cardsPlayed[i].cardPlayed.suit;
    playervalue = this.cardsPlayed[i].cardPlayed.getOrdinalValue();
    if (playersuit === mastersuit && playervalue > mastervalue) {
      winnerId = this.cardsPlayed[i].playerId;
    }
  }

  //winner = this.table.getPlayerById(winnerId);

  return winnerId;
};

Turn.prototype.setCardPlayed = function (playerId, card) {
  console.log('[Turn] [setCardPlayed] playerId: ' + playerId + ', card: ' + card.comboValue);

  var players = _.keys(this.table.players);

  this.cardsPlayed.push({
    playerId: playerId,
    cardPlayed: card,
    timestamp: new Date().getTime()
  });

  this.playingSequence.shift();

  if (this.cardsPlayed.length > 0 && this.cardsPlayed.length < players.length) {
    this.setStatus(Const.TurnStatus.WAITING);
  }

  if (this.cardsPlayed.length === players.length) {
    this.setStatus(Const.TurnStatus.ENDED);
  }
};

Turn.prototype.start = function () {
  this.playingSequence = this.getPlayingSequenceAsArray();

  this.emit(Const.Events.TURN_STARTED, this);

  if (this.isFirstTurn || this.table.deck.length === 0) {
    this.setStatus(Const.TurnStatus.IDLE);
  } else {
    this.setStatus(Const.TurnStatus.DRAW_CARDS);
  }
};

Turn.prototype.getRejoinData = function(){
  return _.pick(this, 'id', 'cardsPlayed', 'drawedCards', 'isFirstTurn', 'playerToActId');
};

Turn.prototype.getSaveData = function(){
  return _.pick(this, 'id', 'cardsPlayed', 'drawedCards', 'winnerId', 'playingSequence');
};
