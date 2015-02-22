/**
 * Created by alessandrobisi on 30/11/14.
 */
'use strict';



function Card(val, owner) {
  this.id = require('../utils/uuidgen').uuidFast();
  this.front = (val.length === 2) ? val[0] : val[0] + val[1];
  this.suit = (val.length === 2) ? val[1] : val[2];
  this.comboValue = val;
  this.owner = owner;
}
module.exports = Card;

Card.prototype.getOrdinalValue = function () {
  var retval = 0;

  switch (this.front) {
    case '3':
      retval = 10;
      break;
    case '2':
      retval = 9;
      break;
    case 'A':
      retval = 8;
      break;
    case 'K':
      retval = 7;
      break;
    case 'Q':
      retval = 6;
      break;
    case 'J':
      retval = 5;
      break;
    case '7':
      retval = 4;
      break;
    case '6':
      retval = 3;
      break;
    case '5':
      retval = 2;
      break;
    case '4':
      retval = 1;
      break;
  }

  return retval;
};

Card.prototype.getNumericValue = function () {
  var retval = 0;

  switch (this.front) {
    case '3':
      retval = 0.33;
      break;
    case '2':
      retval = 0.33;
      break;
    case 'A':
      retval = 1;
      break;
    case 'K':
      retval = 0.33;
      break;
    case 'Q':
      retval = 0.33;
      break;
    case 'J':
      retval = 0.33;
      break;
    case '7':
      retval = 0;
      break;
    case '6':
      retval = 0;
      break;
    case '5':
      retval = 0;
      break;
    case '4':
      retval = 0;
      break;
  }

  return retval;
};

Card.prototype.getCard = function () {
  return {
    id: this.id,
    front: this.front,
    suit: this.suit,
    comboValue: this.comboValue,
    owner: this.owner,
    ordinalValue: this.getOrdinalValue(),
    numericValue: this.getNumericValue()
  };
};

