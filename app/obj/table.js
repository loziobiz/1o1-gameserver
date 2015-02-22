/**
 * Created by alessandrobisi on 30/11/14.
 */
'use strict';

var _ = require('underscore'),
    globalTimer = require('../utils/globalTimer'),
    Const = require('../conf/const'),
    UUIDGen = require('../utils/uuidgen'),
    Game = require('./game'),
    Utils = require('../utils/utils'),
    events = require('events'),
    moment = require('moment'),
    Events = Const.Events,
    roomsManager = require('../server/roomsManager'),
    rooms = roomsManager.rooms;

function Table(config, room) {
  events.EventEmitter.call(this);

  this.id = UUIDGen.uuidFast();
  this.config = config;
  this.status = Const.TableStatus.AVAILABLE;
  this.players = {};
  this.holeCards = {};
  this.gameObj = undefined;
  this.deck = [];
  this.roomId = room.id;

  this.redemptionList = undefined;

  var that = this;

  room.on(Events.PLAYER_LEAVE_ROOM, function(playerid){
    var playerIds = _.pluck( that.players, 'id' );

    if (_.indexOf(playerIds, playerid) > -1){
      that.playerLeave(playerid);
    }
  });

  this.createGame();
}
module.exports = Table;
Table.prototype.__proto__ = events.EventEmitter.prototype;

Table.prototype.createGame = function () {
  var that = this
    , game = new Game(this.config.gameConfig);

  this.gameObj = game;
  this.gameObj.tableId = this.id;
  this.gameObj.roomId = this.roomId;

  this.gameObj.on(Events.GAME_ENDED, function(){
    that.gameObj.removeAllListeners(Events.GAME_ENDED);
    that.changeStatus(Const.TableStatus.ENDED);
  });

  this.emit(Const.Events.GAME_CREATED, this.gameObj);
};

Table.prototype.changeStatus = function (newStatus) {
  console.log('[Table] [changeStatus] -> ' + newStatus);
  var that = this
    , oldStatus = this.status;

  this.status = newStatus;

  switch (newStatus){
    case Const.TableStatus.PLAYING:
      if (oldStatus === Const.TableStatus.SUSPENDED){
        this.gameObj.resume();
      }
      if (oldStatus === Const.TableStatus.WAITING){
        this.gameObj.start();
      }

      break;

    case Const.TableStatus.SUSPENDED:
      if (oldStatus === Const.TableStatus.PLAYING) {
        this.gameObj.suspend();
      }

      break;

    case Const.TableStatus.ENDED:
      console.log();

      _.delay(function(){
        that.changeStatus(Const.TableStatus.AVAILABLE);
        that.players = {};
        that.holeCards = {};
        that.redemptionList = {};

        that.createGame();
      }, 10000);

      break;
  }

  this.emit(Const.Events.TABLE_CHANGE_STATUS, newStatus);
};

Table.prototype.playerJoin = function (player) {
  if (_.size(this.players) >= this.config.playerLimit) {
    throw new Error('This table is full');
  }

  this.players[player.id] = player;

  var nPlayers = _.size(this.players);

  if (nPlayers > 0 && nPlayers < this.config.playerLimit) {
    this.changeStatus(Const.TableStatus.WAITING);
  } else if (nPlayers === this.config.playerLimit) {
    if ( this.status === Const.TableStatus.SUSPENDED ){
      delete this.redemptionList[player.id];

      if (_.size(this.redemptionList) === 0){
        this.disconnectionTimerOff();
      }
    }

    this.changeStatus(Const.TableStatus.PLAYING);
  }
};

Table.prototype.playerLeave = function (playerId) {
  if ( this.players[playerId] === undefined ) {
    throw new Error('This player is not on this table');
  }

  delete this.players[playerId];

  this.redemptionList = this.redemptionList || {};

  this.redemptionList[playerId] = {
    disconnectionMoment: moment()
  };

  this.disconnectionTimerOn();

  this.changeStatus( Const.TableStatus.SUSPENDED );
};

Table.prototype.getPlayerById = function (playerId) {
  return this.players[playerId];
};

Table.prototype.getCardsFromDeckAsArray = function (nCards) {
  var hand = [];

  for (var i = 0; i < nCards; i++) {
    hand.push(this.deck.shift());
  }

  return hand;
};

Table.prototype.getCardsFromDeckAsObject = function (nCards) {
  var handAsArray = this.getCardsFromDeckAsArray(nCards),
      hand = {};

  _.each(handAsArray, function(card, index, list){
    hand[card.id] = card;
  });

  return hand;
};

Table.prototype.setPlayerReady = function (playerId) {
  var player = this.players[playerId];

  player.readyToPlay = true;

  this.checkGameCanStart();
};

Table.prototype.checkGameCanStart = function () {
  var playersId = _.keys(this.players),
      nplayers = playersId.length,
      i = nplayers,
      count = 0,
      canStart = false;

  while (i--) {
    if (this.players[playersId[i]].readyToPlay) count++;
  }

  if (nplayers === count) {
    canStart = true;
    this.gameObj.newRound();
  }

  return canStart;
};

Table.prototype.disconnectionTimerOn = function(){
  var that = this;

  globalTimer.on(Events.TIMER_EVENT, function(time){
    var limit = time.subtract( that.config.disconnectionTimeoutInSeconds, 'seconds' );

    _.each(that.redemptionList, function(player,id,list){
      console.log('DISCONNECTION TIMER: limit = ' + limit.format('HH:mm:ss') + ', disconnectionMoment = ' + player.disconnectionMoment.format('HH:mm:ss'));
      if (player.disconnectionMoment.isBefore(limit)){
        console.log('END MATCH FOR DISCONNECTION!!!!');
        that.disconnectionTimerOff();

        that.gameObj.endGameForDisconnectedPlayer(id);
      }
    });
  });
};

Table.prototype.disconnectionTimerOff = function(){
  globalTimer.removeAllListeners( Events.TIMER_EVENT );
};

Table.prototype.getData = function (playerId) {

  /*
  if (!playerId){
    throw new Error("Player ID missing", 1078);
  }
  */

  var data = _.pick(this, 'id', 'status', 'players', 'config', 'holeCards')
    , playerHoleCards = (playerId) ? Utils.hideCardsButPlayer( this.holeCards, playerId ) : undefined;

  data.holeCards = playerHoleCards;

  return data;
};

