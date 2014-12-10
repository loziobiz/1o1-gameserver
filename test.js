/**
 * Created by alessandrobisi on 30/11/14.
 */
'use strict';

var Room = require( './room'),
    Table = require( './table'),
    Game = require( './game' ),
    Const = require('./const'),
    Events = Const.Events,
    PEvents = Const.ProtocolEvents,
    Player = require( './player'),
    _ = require('underscore'),
    ai = require( './ai'),
    roomsConfig = require('./roomsConf'),
    gamesConfig = require( './gamesConfig'),
    gameServerManager = require('./gameServerManager'),
    io = require('socket.io-client')


var socket = io.connect('localhost:5000', {reconnect: true});


/*
gameServerManager.start();

var player1 = new Player('01');
player1.nickName = "p1"
var player2 = new Player('02');
player2.nickName = "p2"

rooms.tresette.addPlayer(player1);
rooms.tresette.addPlayer(player2);

var tableIds = _.keys(rooms['tresette'].tables);

rooms['tresette'].tables[tableIds[0]].playerJoin( player1 );
rooms['tresette'].tables[tableIds[0]].playerJoin( player2 );
*/
/*
console.log("\n\nroom1: ");
console.log(room1);

console.log("\n\ngame: ");
console.log(game1);
*/