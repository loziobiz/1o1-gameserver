/**
 * Created by alessandrobisi on 07/12/14.
 */

var gamesConfig = require('./gamesConfig');

var rooms = {
  tresette: {
    name: 'Tresette',
    isOpen: false,
    isActive: true,
    description: 'Tresette game',
    tables: {
      tresette01: {
        id: 'tresette10',
        name: 'Tresette 10',
        stake: 10,
        gameConfig: gamesConfig.tresette,
        playerLimit: 2,
        disconnectionTimeoutInSeconds: 30,
        numberOfInstances: 1
      },
      tresette02: {
        id: 'tresette20',
        name: 'Tresette 20',
        stake: 20,
        gameConfig: gamesConfig.tresette,
        playerLimit: 2,
        disconnectionTimeoutInSeconds: 30,
        numberOfInstances: 1
      }
    }
  },
  scopa: {
    name: 'Scopa',
    isOpen: false,
    isActive: false,
    description: 'Coming Soon',
    tables: {}
  }
};
module.exports = rooms;
