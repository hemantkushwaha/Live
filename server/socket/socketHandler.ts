import { Server as SocketIOServer, Socket } from 'socket.io';
import { Logger } from '../utils/logger';

export function initSocketServer(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    Logger.info('Socket', `Client connected: ID ${socket.id}`);

    socket.on('disconnect', (reason) => {
      Logger.info('Socket', `Client disconnected: ID ${socket.id} (Reason: ${reason})`);
    });
  });
}
