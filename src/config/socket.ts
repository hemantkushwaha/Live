import { ManagerOptions, SocketOptions } from 'socket.io-client';
import { CLIENT_CONFIG } from './config';

export const clientSocketOptions: Partial<ManagerOptions & SocketOptions> = {
  transports: [...CLIENT_CONFIG.socketOptions.transports],
  autoConnect: CLIENT_CONFIG.socketOptions.autoConnect,
  reconnection: CLIENT_CONFIG.socketOptions.reconnection,
  reconnectionAttempts: CLIENT_CONFIG.socketOptions.reconnectionAttempts,
  reconnectionDelay: CLIENT_CONFIG.socketOptions.reconnectionDelay,
  timeout: CLIENT_CONFIG.timeouts.API_REQUEST_MS,
};
