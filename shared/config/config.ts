import { APP_NAME, APP_VERSION, API_VERSION, ROUTE_PREFIX, DEFAULT_TIMEOUTS } from '../constants/constants';

export const SHARED_CONFIG = {
  appName: APP_NAME,
  appVersion: APP_VERSION,
  apiVersion: API_VERSION,
  routePrefix: ROUTE_PREFIX,
  timeouts: DEFAULT_TIMEOUTS,
  socketOptions: {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },
} as const;

export type SharedConfig = typeof SHARED_CONFIG;
