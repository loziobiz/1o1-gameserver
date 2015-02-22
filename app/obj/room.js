/**
 * Created by alessandrobisi on 30/11/14.
 */

'use strict';

var Table = require('./table'),
    Const = require('../conf/const'),
    events = require('events'),
    _ = require('underscore');

function Room(id, config) {
  events.EventEmitter.call(this);

  this.id = id;
  this.config = config;
  this.players = [];
  this.tables = {};
  this.name = config.name;

  if (this.config.isActive) {
    this.createTables();
  }
}
module.exports = Room;
Room.prototype.__proto__ = events.EventEmitter.prototype;

Room.prototype.createTables = function () {
  //TODO: iterare per numero istanze in configurazione

  var that = this;

  _.each(this.config.tables, function (value, key, list) {
    that.addTable(value);
  });
};

Room.prototype.addTable = function (config) {
  var that = this,
      table = new Table(config, this);

  table.on(Const.Events.TABLE_CHANGE_STATUS, function (newStatus) {
    switch (newStatus) {
      case Const.TableStatus.PLAYING :
        that.emit(Const.Events.TABLE_START_PLAYING, this);

        break;

      default :

        break;
    }

    that.emit(Const.Events.TABLE_UPDATE, this);
  });

  this.tables[table.id] = table;

  this.emit(Const.Events.TABLE_CREATE, table.id);
};

Room.prototype.getTables = function (playerId) {
  var that = this,
    tables = {};

  _.each(this.tables, function (value, key, list) {
    tables[key] = that.tables[key].getData(playerId);
  });

  return tables;
};

Room.prototype.addPlayer = function (player) {
  this.players.push(player);
};

Room.prototype.removePlayer = function (playerId) {
  var i = this.players.length;

  while(i--){
    if (this.players[i].id === playerId){
      this.players.splice( i, 1 );
    }
  }

  this.emit(Const.Events.PLAYER_LEAVE_ROOM, playerId);
};

Room.prototype.getData = function (playerId) {
  return {
    id: this.id,
    tables: this.getTables(playerId),
    name: this.name,
    playerNum: this.players.length
  };
};

