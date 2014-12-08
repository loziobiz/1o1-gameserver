/**
 * Created by alessandrobisi on 30/11/14.
 */

'use strict';

var Table = require( './table'),
    Const = require('./const'),
    events = require('events'),
    _ = require('underscore');

function Room(id, config){
    events.EventEmitter.call(this);

    this.id = id;
    this.config = config;
    this.players = [];
    this.tables = {};
    this.name = config.name;

    if ( this.config.isActive ){
        this.createTables();
    }
};
Room.prototype.__proto__ = events.EventEmitter.prototype;

Room.prototype.createTables = function() {
    //TODO: iterare per numero istanze in configurazione
    var that = this;
    _.each(this.config.tables, function(value, key, list){
        var table = new Table( value, that.id );
        table.on( Const.Events.TABLE_CHANGE_STATUS, function(newStatus){
            if ( newStatus === Const.TableStatus.PLAYING ){
                that.emit( Const.Events.TABLE_START_PLAYING, this );
            }
        } );
        that.addTable( table );
    });
};

Room.prototype.addPlayer = function(player) {
    this.players.push(player);
};

Room.prototype.addTable = function(table) {
    this.tables[table.id] = table;
};

Room.prototype.getData = function(){
    return {
        id: this.id,
        tables: this.tables,
        name: this.name,
        playerNum: this.players.length
    }
}

module.exports = Room;