/**
 * Created by alessandrobisi on 09/12/14.
 */

var _ = require('underscore');

var rooms = {};

var self = module.exports = {

    rooms: rooms,
    getRoomNumber: function(){
        return _.size(rooms);
    },
    getRoomIds: function(){
        return _.keys(rooms);
    },
    addRoom: function(room){
        rooms[room.id] = room

        return rooms[room.id];
    }

};