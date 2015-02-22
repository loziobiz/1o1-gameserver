/**
 * Created by alessandrobisi on 30/11/14.
 */

'use strict';

var EventEmitter = require('events').EventEmitter;

var globalTimer = new EventEmitter();

setInterval(function(){
  globalTimer.emit( require('../conf/const').Events.TIMER_EVENT,  require('moment')() );
}, 1000);

module.exports = globalTimer;
