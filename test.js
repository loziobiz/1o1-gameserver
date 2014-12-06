/**
 * Created by alessandrobisi on 30/11/14.
 */
'use strict';

var Room = require( './room'),
    Table = require( './table'),
    Game = require( './game' ),
    Card = require( './card' ),
    Player = require( './player'),
    _ = require('underscore'),
    ai = require( './ai'),
    gamesConfig = require( './gamesConfig' );


var room1 = new Room("Test Room");
var table1 = new Table('001');
var game1 = new Game( gamesConfig.tresette );

//console.log(game1.deck);

table1.gameObj = game1;
game1.setTable( table1 );

game1.eventDispatcher.on( 'game_started', function(player){
    //console.log( '...... Game is waiting for player: ' + player.id + ' .......' );
    _.each(table1.players, function(element, index, list){
        game1.setPlayerReady( element.id );
    })
} );

game1.eventDispatcher.on( 'GAME_WAITING', function(player){
    //console.log( '...... Game is waiting for player: ' + player.id + ' .......' );
    var firstPlayableCard = ai.getFirstPlayableCard( table1.getPlayerById( player.id ).holeCards, game1.getLastTurn() );
    game1.playCard( player.id, firstPlayableCard.id );
} );

game1.eventDispatcher.on( 'CARD_NOT_PLAYABLE', function(card){
    console.log( 'CARD_NOT_PLAYABLE: ' + JSON.stringify(card) );
} );

game1.eventDispatcher.on( 'ROUND_ENDED', function(round){
    console.log( 'ROUND IS OVER');
    console.log( '> player ' + table1.players[0].id + ' = ' + round.scores[table1.players[0].id] );
    console.log( '> player ' + table1.players[1].id + ' = ' + round.scores[table1.players[1].id] );
} );

room1.addTable(table1);

var player1 = new Player('01');
var player2 = new Player('02');

room1.addPlayer(player1);
room1.addPlayer(player2);

table1.playerJoin( player1 );
table1.playerJoin( player2 );

/*
console.log("\n\nroom1: ");
console.log(room1);

console.log("\n\ngame: ");
console.log(game1);
*/