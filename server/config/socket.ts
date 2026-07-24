import { ServerOptions } from 'socket.io';
import { SERVER_CONFIG } from './config';

export const socketServerOptions: Partial<ServerOptions> = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: SERVER_CONFIG.timeouts.PING_INTERVAL_MS,
  pingTimeout: SERVER_CONFIG.timeouts.PING_TIMEOUT_MS,
  transports: ['websocket', 'polling'],
};
