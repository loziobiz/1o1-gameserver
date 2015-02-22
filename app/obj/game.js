/**
 * Created by alessandrobisi on 29/11/14.
 */
'use strict';

var Turn = require('./turn'),
    Const = require('../conf/const'),
    roomsManager = require('../server/roomsManager'),
    rooms = roomsManager.rooms,
    _ = require('underscore'),
    events = require('events'),
    mongojs = require('mongojs'),
    UUIDGen = require('../utils/uuidgen'),
    ai = require('../ai/ai'),
    deck = require('./deck'),
    moment = require('moment');

var db = mongojs('101gameserver', ['games', 'rounds']);

db.on('ready',function() {
  console.log('database connected');
});
db.on('error',function(err) {
  console.log('database error', err);
});

function Game(gameConfig) {
  events.EventEmitter.call(this);

  this.id = UUIDGen.uuidFast();
  this.config = gameConfig;
  this.scores = {};
  this.rounds = [];
  this.tableId = undefined;
  this.roomId = undefined;
  this.creationDate = moment();
  this.startDate = undefined;
  this.endDate = undefined;
}
Game.prototype.__proto__ = events.EventEmitter.prototype;
module.exports = Game;

Game.prototype.getTableObj = function () {
  return rooms[this.roomId].tables[this.tableId];
};

Game.prototype.getRoundById = function  (id) {
  var i = this.rounds.length;

  while (i--) {
    if (id === this.rounds[i].id) return this.rounds[i];
  }
};

Game.prototype.onTurnChangeStatus = function (oldStatus, newStatus, thisObj) {
  var that = this;

  switch (newStatus) {
    case Const.TurnStatus.DRAW_CARDS:
      console.log('[Game] [ ' + thisObj.getTableObj().deck.length + ' ] cards left in deck');

      _.defer(function () {
        thisObj.emit(Const.Events.TURN_DRAW_CARDS, that.drawedCards);
      });

      _.delay(function () {
        that.setStatus(Const.TurnStatus.IDLE);
      }, 50);


      break;

    case Const.TurnStatus.IDLE:
    case Const.TurnStatus.WAITING:
      _.defer(function () {
        thisObj.emit(Const.Events.GAME_WAITING, thisObj.getPlayerToActId());
      });

      break;

    case Const.TurnStatus.ENDED:
      this.removeAllListeners(Const.Events.TURN_CHANGE_STATUS);

      _.defer(function () {
        thisObj.emit(Const.Events.TURN_ENDED, that.winnerId);
      });

      _.delay(function () {
        var round = thisObj.getRoundById( that.roundId );

        if (that.isLastTurn()) {
          thisObj.endRound( round );
        } else {
          thisObj.newTurn( round );
        }
      }, 10);

      break;
  }
};

Game.prototype.onTurnStarted = function (thisObj) {
  var that = this;

  this.removeAllListeners(Const.Events.TURN_STARTED);

  _.defer(function () {
    thisObj.emit(Const.Events.TURN_STARTED, that.id);
  });
};

Game.prototype.calculateRoundScores = function (round) {
  var _scores = {}
    , _points = {}
    , _lastTurnWinnerId = round.turns[round.turns.length - 1].winnerId;

  _.each(this.getTableObj().players, function (element, index, list) {
    _scores[element.id] = 0;
    _points[element.id] = [];
  });

  _.each(_scores, function (value, key, list) {
    var _playerWins = _.where(round.turns, {winnerId: key})
      , _playerPluck = _.pluck(_playerWins, 'cardsPlayed')
      , _i = _playerPluck.length
      , _j = 0
      , _score = 0;

    while (_i--) {
      _j = _playerPluck[_i].length;

      while (_j--) {
        _score = _playerPluck[_i][_j].cardPlayed.getNumericValue();
        _points[key].push(_playerPluck[_i][_j].cardPlayed.comboValue);
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

Game.prototype.endRound = function (round) {
  var targetScoreReached = false,
      that = this;

  this.calculateRoundScores(round);

  _.each(round.scores, function (value, key, list) {
    that.scores[key] += value;
    if (that.scores[key] >= that.config.targetScore) targetScoreReached = true;
  });

  round.isEnded = true;

  that.emit(Const.Events.ROUND_ENDED, round);

  if (!targetScoreReached) {
    that.newRound();
  } else {
    that.end();
    that.emit(Const.Events.GAME_ENDED);
  }
};

Game.prototype.endGameForDisconnectedPlayer = function (disconnectedPlayerId) {
  var that = this;

  _.each(that.scores, function (score, id, list) {
    if (id !== disconnectedPlayerId){
      that.scores[id] = that.config.targetScore;
    }

  });

  that.emit(Const.Events.GAME_ENDED);
};
/**
 *
 * @param round
 */
Game.prototype.newTurn = function (round) {
  console.log('[Game] >>>>> NEW TURN ---------------');
  var that = this,
    _round = (round) ? round : this.getLastRound(),
    isFirstTurn = ( _round.turns.length > 0 ) ? false : true,
    lastWinnerId = ( _round.turns.length > 0 ) ?
      this.getLastTurn().winnerId : undefined,

    turn = new Turn(this.getTableObj(), this.getLastRound().id, isFirstTurn, this.getDealerIdx(), lastWinnerId);

  turn.on(Const.Events.TURN_CHANGE_STATUS, function (oldStatus, newStatus) {
    that.onTurnChangeStatus.call(this, oldStatus, newStatus, that);
  });

  turn.on(Const.Events.TURN_STARTED, function () {
    that.onTurnStarted.call(this, that);
  });

  _round.turns.push(turn);

  var turnsForSave = [];
  _.each(_round.turns, function(turn, index, list){
    turnsForSave.push(turn.getSaveData());
  });

  db.rounds.update({ _id: _round.id }, {
    $set: {turns: turnsForSave}
  }, function(err, value){
    console.log();
  });

  turn.start();
};

Game.prototype.newRound = function () {
  console.log('[Game] ========= NEW ROUND ============');
  var round = {},
    dealSequence = [],
    player,
    that = this,
    table = this.getTableObj(),
    playerIds = _.keys(table.players),
    playersNum = playerIds.length,
    cards = require('../conf/deckTypes')[this.config.deckType],
    i;

  /* Prepare deck */
  table.deck = deck.getShuffledDeck(cards);
  round.deck = table.deck;

  /* Generate id and set dealer index */
  round.id = UUIDGen.uuidFast();
  round.dealerIdx = this.getDealerIdx();
  round.dealerId = playerIds[round.dealerIdx];

  /* Sets dealing sequence */
  for (i = round.dealerIdx; i < playersNum; i++) dealSequence.push(playerIds[i]);
  for (i = 0; i < round.dealerIdx; i++) dealSequence.push(playerIds[i]);

  /* Deal cards for each player */
  for (i = 0; i < dealSequence.length; i++) {
    player = table.players[dealSequence[i]];
    table.holeCards[dealSequence[i]] = table.getCardsFromDeckAsObject(this.config.startingCardsNumber);
    round.holeCards = table.holeCards;
    console.log('player ' + player.id + ' holecards: ' + _.pluck( table.holeCards[dealSequence[i]], 'comboValue'));

    // create scores if needed (first round)
    this.scores[player.id] = this.scores[player.id] || 0;
  }

  /* Sets scores obj */
  round.scores = {};

  /* Set empty turns array and add round to rounds array */
  round.turns = [];
  this.rounds.push(round);

  _.defer(function () {
    that.emit(Const.Events.ROUND_NEW, round.dealerId);
  });



  var roundForInsert = _.pick(round, 'id', 'dealSequence', 'deck', 'dealerId', 'holeCards');

  roundForInsert._id = roundForInsert.id;
  delete roundForInsert.id;

  roundForInsert.gameId = this.id;
  roundForInsert.turns = [];

  db.rounds.insert(roundForInsert, function(error, value){
    console.log(error + ', ' + value);
  });

  /* Starts new turn */
  this.newTurn(round);
};

Game.prototype.getDealerIdx = function () {
  var players = this.getTableObj().players
    , playersIdArray = _.keys( players )
    , max = playersIdArray.length - 1
    , randomnumber = Math.floor(Math.random() * (max - 0 + 1)) + 0
    , nRounds = this.rounds.length
    , dealerIdx = 0
    , preDealerIdx = 0;

  if (nRounds > 0) {
    preDealerIdx = this.rounds[nRounds - 1].dealerIdx;
    dealerIdx = ( preDealerIdx < nRounds - 1 ) ? preDealerIdx++ : 0;
  } else {
    dealerIdx = randomnumber;
  }

  return dealerIdx;
};

Game.prototype.start = function () {
  console.log('[Game] [start]');

  var that = this;

  this.startDate = moment();

  _.defer(function () {
    that.emit(Const.Events.GAME_STARTED, that.id);
  });

  db.games.insert({
    _id: this.id,
    tableId: this.tableId,
    config: this.config,
    roomId: this.roomId,
    creationDate: this.creationDate.toISOString(),
    startDate: this.startDate.toISOString()
  }, function(error, value){
    console.log(error + ', ' + value);
  });
};

Game.prototype.suspend = function () {
  console.log('[Game] [suspend]');

  var that = this;

  _.defer(function () {
    that.emit(Const.Events.GAME_SUSPENDED, 'PLAYER_DISCONNECTION');
  });
};

Game.prototype.resume = function () {
  console.log('[Game] [resumed]');

  var that = this;

  _.defer(function () {
    that.emit(Const.Events.GAME_RESUMED, that.id);
  });
};

Game.prototype.end = function () {
  console.log('[Game] [ended]');

  var that = this;

  this.endDate = moment();

  _.defer(function () {
    that.emit(Const.Events.GAME_RESUMED, that.id);
  });
};

Game.prototype.getLastTurn = function () {
  if (!this.getLastRound()) return undefined;

  var turns = this.getLastRound().turns;

  if (turns.length === 0) return undefined;

  return turns[turns.length - 1];
};

Game.prototype.getLastRound = function () {
  if (this.rounds.length === 0) return undefined;

  return this.rounds[this.rounds.length - 1];
};

Game.prototype.getCurrentTurn = function () {
  return this.getLastTurn();
};

Game.prototype.getTurnById = function (turnId) {
  var turns = this.getLastRound().turns,
    i = turns.length;

  while (i--) {
    if (turns[i].id === turnId)
      return turns[i];
  }
};

Game.prototype.checkCardPlayable = function (playedCard, turn, playerCards) {
  var playableCards = ai.getPlayableCards(playerCards, turn),
      retval = false;

  _.each(playableCards, function (card, key, list) {
    if (!playedCard) {
      console.log('error CARD DOES NOT EXISTS!!!!!!!!!!!!!!!!!!!!');
    }
    if (card.id === playedCard.id) {
      retval = true;
    }
  });

  return retval;
};

Game.prototype.playCard = function (playerId, cardId) {
  var that = this;
  var player = this.getTableObj().getPlayerById(playerId);
  var currentTurn = that.getCurrentTurn();
  var playedCard = this.getTableObj().holeCards[playerId][cardId],
      cardIsPlayable = that.checkCardPlayable(playedCard, currentTurn, this.getTableObj().holeCards[playerId]);    //TODO: fare checkCardPlayable compatta senza pescare sempre da getPlayableCards

  if (cardIsPlayable) {
    currentTurn.setCardPlayed(playerId, playedCard);
    delete this.getTableObj().holeCards[playerId][cardId];

    that.emit(Const.Events.CARD_PLAYED, playedCard); //TODO: capire se è il caso di aspettare un evento da turn su cui triggerare questo

    return playedCard;
  } else {
    that.emit(Const.Events.CARD_NOT_PLAYABLE, playedCard);

    return false;
  }

  return false;
};

Game.prototype.checkGameCanStart = function () {
  var table = this.getTableObj(),
    nplayers = table.players.length,
    i = nplayers,
    count = 0;

  while (i--) {
    if (table.players[i].readyToPlay) count++;
  }

  if (nplayers === count)
    this.newRound();
};

Game.prototype.getPlayerToActId = function () {
  var lastTurn = this.getLastTurn();
  return lastTurn.playerToActId;
};

Game.prototype.getData = function () {
  return _.pick(this, 'id', 'tableId', 'roomId', 'config', 'scores');
};

Game.prototype.getRejoinData = function () {
  var that = this
    , data =  _.pick(this, 'id', 'tableId', 'roomId', 'config', 'scores')
    , roundScores = [];

  _.each(that.rounds, function(round, index, list){
    if (round.isEnded){
      roundScores.push(round.scores);
    }
  });

  data.roundScores = roundScores;

  return data;
};

Game.prototype.getOpponents = function (heroId) {
  var table = this.getTableObj(),
    opponents = _.omit(table.players, heroId);

  _.each(opponents, function (v, k, l) {
    opponents[k] = _.omit(opponents[k].getData(), 'holeCards');
  });

  return opponents;
};
