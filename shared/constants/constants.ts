/**
 * Centralized Global Constants for LiveConnect
 */

export const APP_NAME = 'LiveConnect';
export const APP_VERSION = '1.0.0';
export const API_VERSION = 'v1';
export const SOCKET_EVENT_PREFIX = 'lc:';
export const ROUTE_PREFIX = '/api/v1';

export const DEFAULT_TIMEOUTS = {
  API_REQUEST_MS: 10000,
  SOCKET_RECONNECT_MS: 5000,
  CALL_REQUEST_MS: 30000,
  PING_INTERVAL_MS: 25000,
  PING_TIMEOUT_MS: 20000,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
