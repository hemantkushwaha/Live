/**
 * Shared System Constants
 */

export const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

export const APP_CONFIG = {
  CALL_REQUEST_TIMEOUT_MS: 30000, // 30 seconds to respond to private call request
  JWT_EXPIRES_IN: '24h',
} as const;
