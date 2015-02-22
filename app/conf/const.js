/**
 * Created by alessandrobisi on 01/12/14.
 */

var Events = {
  TIMER_EVENT: 'timer_event',
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
  GAME_SUSPENDED: 'GAME_SUSPENDED',
  GAME_RESUMED: 'GAME_RESUMED',
  ROUND_ENDED: 'ROUND_ENDED',
  ROUND_NEW: 'NEW_ROUND',
  CARD_PLAYED: 'CARD_PLAYED',
  CARD_NOT_PLAYABLE: 'CARD_NOT_PLAYABLE',
  TABLE_CREATE: 'table_create',
  TABLE_UPDATE: 'table_update',
  PLAYER_DISCONNECTED: 'player_disconnected',
  PLAYER_LEAVE_ROOM: 'player_leave_room'
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
  EMPTY: 'EMPTY',
  SUSPENDED: 'SUSPENDED',
  ENDED: 'ENDED'
};
exports.TableStatus = TableStatus;

var ProtocolEvents = {
  SOCKET_CONNECTION_RESPONSE: 'socket_connection_response',
  PLAYER_LOGIN: 'playerLogin',
  PLAYER_CONNECT_REQUEST: 'playerConnectRequest',
  PLAYER_CONNECT_RESPONSE: 'playerConnectResponse',
  NOTIFY_PLAYER_CONNECT: 'notify_player_connect',
  NOTIFY_PLAYER_DISCONNECT: 'notify_player_disconnect',
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
  NOTIFY_GAME_STARTED: 'notifyGameStarted',
  NOTIFY_GAME_SUSPENDED: 'notifyGameSuspended',
  NOTIFY_GAME_ENDED: 'notifyGameEnded',
  NOTIFY_ROUND_ENDED: 'notifyRoundEnded',
  TABLE_CREATE: 'table_create',
  TABLE_UPDATE: 'table_update',
  TABLE_LIST_REQUEST: 'table_list_request',
  TABLE_LIST_RESPONSE: 'table_list_response',
  ROOM_DATA_REQUEST: 'room_data_request',
  ROOM_DATA_RESPONSE: 'room_data_response'
};
exports.ProtocolEvents = ProtocolEvents;

var Decks = {
  ITALIAN: 'italian',
  POKER: 'poker'
};
exports.Decks = Decks;
