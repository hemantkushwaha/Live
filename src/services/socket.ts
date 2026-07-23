import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../types';

let socketInstance: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  socketInstance = io(window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socketInstance.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socketInstance;
}

export function getSocket(): Socket | null {
  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export { SOCKET_EVENTS };
