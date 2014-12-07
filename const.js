/**
 * Created by alessandrobisi on 01/12/14.
 */

var Events = {
    TABLE_CHANGE_STATUS: 'table_change_status',
    TURN_CHANGE_STATUS: 'turn_change_status',
    TURN_READY: 'turn_new',
    TURN_ENDED: 'TURN_ENDED',
    TURN_STARTED: 'TURN_STARTED',
    TURN_DRAW_CARDS: 'TURN_DRAW_CARDS',
    GAME_WAITING: 'GAME_WAITING',
    GAME_ENDED: 'GAME_ENDED',
    GAME_STARTED: 'GAME_STARTED',
    ROUND_ENDED: 'ROUND_ENDED',
    ROUND_NEW: 'NEW_ROUND',
    CARD_PLAYED: 'CARD_PLAYED',
    CARD_NOT_PLAYABLE: 'CARD_NOT_PLAYABLE',
    TURN_DRAW_CARDS: 'TURN_DRAW_CARDS'
};
exports.Events = Events;

var TurnStatus = {
    DRAW_CARDS: 'DRAW_CARDS',
    IDLE: 'IDLE',
    WAITING: 'WAITING',
    ENDED: 'ENDED',
    EMPTY: 'EMPTY'
};
exports.TurnStatus = TurnStatus;

var TableStatus = {
    AVAILABLE: 'AVAILABLE',
    WAITING: 'WAITING',
    PLAYING: 'PLAYING',
    EMPTY: 'EMPTY'
};
exports.TableStatus = TableStatus;