/**
 * Created by alessandrobisi on 01/12/14.
 */

var Events = {
    TABLE_CHANGE_STATUS: 'table_change_status',
    TABLE_START_PLAYING: 'TABLE_START_PLAYING',
    TURN_CHANGE_STATUS: 'turn_change_status',
    TURN_READY: 'turn_new',
    TURN_ENDED: 'TURN_ENDED',
    TURN_STARTED: 'TURN_STARTED',
    TURN_DRAW_CARDS: 'TURN_DRAW_CARDS',
    GAME_WAITING: 'GAME_WAITING',
    GAME_ENDED: 'GAME_ENDED',
    GAME_STARTED: 'GAME_STARTED',
    GAME_CREATED: 'GAME_CREATED',
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

var ProtocolEvents = {
    PLAYER_CONNECT_REQUEST: 'playerConnectRequest',
    PLAYER_CONNECT_RESPONSE: 'playerConnectResponse',
    PLAYER_JOIN_REQUEST: 'playerJoinRequest',
    PLAYER_JOIN_RESPONSE: 'playerJoinResponse',
    PLAYER_READY_REQUEST: 'playerReadyToPlayRequest',
    PLAYER_READY_RESPONSE: 'playerReadyToPlayResponse',
    PLAY_CARD_REQUEST: 'playCardRequest',
    PLAY_CARD_RESPONSE: 'playCardResponse',
    NOTIFY_PLAYER_JOIN: 'notifyPlayerJoin',
    NOTIFY_PLAYER_READY: 'notifyPlayerReadyToPlay',
    NOTIFY_PLAY_CARD: 'notifyPlayCard',
    NOTIFY_ERROR: 'notifyError',
    NOTIFY_NEW_ROUND: 'notifyNewRound',
    NOTIFY_WAIT_PLAYER_ACTION: 'notifyWaitingForPlayerAction',
    NOTIFY_TURN_ENDED: 'notifyTurnEnded',
    NOTIFY_TURN_STARTED: 'notifyTurnStarted',
    NOTIFY_DRAW_CARDS: 'notifyDrawCards',
    NOTIFY_GAME_STARTED: 'notifyGameStarted'
}
exports.ProtocolEvents = ProtocolEvents;