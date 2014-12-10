/**
 * Created by alessandrobisi on 30/11/14.
 */
'use strict';

var _ = require('underscore'),
    Const = require('./const'),
    UUIDGen = require('./uuidgen'),
    Game = require( './game' ),
    events = require('events');

module.exports = Table;

function Table(config, roomId){
    events.EventEmitter.call(this);

    this.id = UUIDGen.uuidFast();
    this.config = config;
    this.status = Const.TableStatus.AVAILABLE;
    this.players = {};
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
        this.gameObj.startServer();
    }

    this.emit( Const.Events.TABLE_CHANGE_STATUS, newStatus );
}

Table.prototype.playerJoin = function(player) {
    if (_.size( this.players ) >= this.config.playerLimit ){
        throw new Error('This table is full');
    }

    this.players[player.id] = player;

    var nPlayers = _.size( this.players );

    if ( nPlayers > 0 && nPlayers < this.config.playerLimit ){
        this.changeStatus( Const.TableStatus.WAITING );
    } else if ( nPlayers == this.config.playerLimit ){
        this.changeStatus( Const.TableStatus.PLAYING );
    }
}

Table.prototype.getPlayerById = function(playerId){
    return players[playerId];
};

Table.prototype.getCardsFromDeck = function(nCards){
    var hand = [];

    for (var i=0; i<nCards; i++){
        hand.push( this.deck.shift() );
    }

    return hand;
}

Table.prototype.setPlayerReady = function(playerId){
    var player = this.players[playerId];

    player.readyToPlay = true;

    this.checkGameCanStart();
}

Table.prototype.checkGameCanStart = function(){
    var playersId = _.keys(this.players),
        nplayers = playersId.length,
        i = nplayers,
        count = 0,
        canStart = false;

    while(i--){
        if ( this.players[playersId[i]].readyToPlay ) count++;
    }

    if ( nplayers === count ){
        canStart = true;
        this.gameObj.newRound();
    }

    return canStart;
}

Table.prototype.getData = function(){
    return _.pick(this, 'id', 'status', 'players', 'config');
}

