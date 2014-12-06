/**
 * Created by alessandrobisi on 30/11/14.
 */
'use strict';

var EventConstants = require('./eventConstants'),
    events = require('events');

function Table(tableID){
    events.EventEmitter.call(this);

    this.id = tableID;
    this.status = "available";
    this.players = [];
    this.board = [];
    this.playerLimit = 2;
    this.gameObj = undefined;
    this.deck = [];
}
Table.prototype.__proto__ = events.EventEmitter.prototype;

Table.prototype.changeStatus = function(newStatus){
    console.log( '[Table] [changeStatus] -> ' + newStatus );
    this.status = newStatus;

    this.emit( EventConstants.TABLE_CHANGE_STATUS, newStatus );
}

Table.prototype.playerJoin = function(player) {
    var nPlayers = this.players.length;

    if ( nPlayers >= this.playerLimit ){
        throw new Error('This table is full');
    }

    this.players.push( player );

    nPlayers = this.players.length;

    if ( nPlayers > 0 && nPlayers < this.playerLimit ){
        this.changeStatus( 'waiting' );
    } else if ( nPlayers == this.playerLimit ){
        this.changeStatus( 'playing' );
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

module.exports = Table;