/**
 * Socket.io Event Constants for LiveConnect
 */
export const SOCKET_EVENTS = {
  // System / Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // User Presence
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  GET_ONLINE_USERS: 'users:get_online',
  ONLINE_USERS_LIST: 'users:online_list',

  // Public Stream
  START_STREAM: 'stream:start',
  STREAM_STARTED: 'stream:started',
  STOP_STREAM: 'stream:stop',
  STREAM_STOPPED: 'stream:stopped',
  JOIN_STREAM: 'stream:join',
  LEAVE_STREAM: 'stream:leave',
  VIEWER_JOINED: 'stream:viewer_joined',
  VIEWER_LEFT: 'stream:viewer_left',
  ACTIVE_STREAMS_LIST: 'stream:active_list',

  // WebRTC Signaling (Public Broadcast & Private Call)
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc:ice_candidate',

  // Private 1-on-1 Call Request Flow
  REQUEST_PRIVATE_CALL: 'private:request_call',
  PRIVATE_CALL_REQUESTED: 'private:call_requested',
  RESPOND_PRIVATE_CALL: 'private:respond_call',
  PRIVATE_CALL_ACCEPTED: 'private:call_accepted',
  PRIVATE_CALL_STARTED: 'private:call_started',
  PRIVATE_CALL_REJECTED: 'private:call_rejected',
  END_PRIVATE_CALL: 'private:end_call',
  PRIVATE_CALL_ENDED: 'private:call_ended',

  // Stream State Switching
  STREAM_PAUSED_FOR_PRIVATE: 'stream:paused_for_private',
  STREAM_RESUMED_FROM_PRIVATE: 'stream:resumed_from_private',

  // Error Handling
  ERROR: 'system:error'
} as const;

export type SocketEventType = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
