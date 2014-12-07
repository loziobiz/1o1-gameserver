/**
 * Created by alessandrobisi on 30/11/14.
 */

'use strict';

function Room(id, name){
    this.id = id;
    this.players = [];
    this.tables = [];
    this.name = name;
};

Room.prototype.addPlayer = function(player) {
    this.players.push(player);
};

Room.prototype.addTable = function(table) {
    this.tables.push(table);
};

module.exports = Room;