import { ServerOptions } from 'socket.io';
import { SERVER_CONFIG } from './config';

export const socketServerOptions: Partial<ServerOptions> = {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
  pingInterval: SERVER_CONFIG.timeouts.PING_INTERVAL_MS,
  pingTimeout: SERVER_CONFIG.timeouts.PING_TIMEOUT_MS,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
};
