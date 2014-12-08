/**
 * Created by alessandrobisi on 30/11/14.
 */
'use strict';

var Const = require('./const'),
    UUIDGen = require('./uuidgen'),
    Game = require( './game' ),
    events = require('events');

function Table(config, roomId){
    events.EventEmitter.call(this);

    this.id = UUIDGen.uuidFast();
    this.config = config;
    this.status = Const.TurnStatus.AVAILABLE;
    this.players = [];
    this.board = [];
    this.playerLimit = config.playerLimit;
    this.gameObj = undefined;
    this.deck = [];
    this.roomId = roomId;
    this.createGame();
}
Table.prototype.__proto__ = events.EventEmitter.prototype;

Table.prototype.createGame = function(){
    var game = new Game( this.config.gameConfig );
    this.gameObj = game;
    this.gameObj.tableId = this.id;
    this.gameObj.roomId = this.roomId;
    this.emit( Const.Events.GAME_CREATED, this.gameObj );
}

Table.prototype.changeStatus = function(newStatus){
    console.log( '[Table] [changeStatus] -> ' + newStatus );
    this.status = newStatus;

    if ( newStatus === Const.TableStatus.PLAYING ){
        this.gameObj.start();
    }

    this.emit( Const.Events.TABLE_CHANGE_STATUS, newStatus );
}

Table.prototype.playerJoin = function(player) {
    var nPlayers = this.players.length;

    if ( nPlayers >= this.playerLimit ){
        throw new Error('This table is full');
    }

    this.players.push( player );

    nPlayers = this.players.length;

    if ( nPlayers > 0 && nPlayers < this.playerLimit ){
        this.changeStatus( Const.TableStatus.WAITING );
    } else if ( nPlayers == this.playerLimit ){
        this.changeStatus( Const.TableStatus.PLAYING );
    }
}

Table.prototype.getPlayerById = function(playerId){
    var i = this.players.length;

    while (i--) {
        if ( this.players[i].id === playerId ) return this.players[i];
    }
};

Table.prototype.getPlayerIndexById = function(playerId){
    var i = this.players.length;

    while (i--) {
        if ( this.players[i].id === playerId ) return i;
    }
};

Table.prototype.getCardsFromDeck = function(nCards){
    var hand = [];

    for (var i=0; i<nCards; i++){
        hand.push( this.deck.shift() );
    }

    return hand;
}

Table.prototype.getData = function(){
    return {
        id: this.id,
        config: this.config,
        status: this.status,
        players: this.players
    }
}

module.exports = Table;