/**
 * Created by alessandrobisi on 30/11/14.
 */

'use strict';

var _ = require('underscore'),
    UUIDGen = require('../utils/uuidgen');

function Player(playerID) {
  this.id = ( playerID ) ? playerID : UUIDGen.uuidFast();
  this.nickName = '';
  this.readyToPlay = false;
  this.socketId = 0;

  this.roundPointElements = {
    punti: 0,
    terzi: 0,
    bongioco: 0,
    napoli: 0,
    rete: 0,
    cappotto: 0
  };
}
module.exports = Player;

Player.prototype.getData = function () {
  return _.omit(this, 'socketId', 'roundPointElements');
};
