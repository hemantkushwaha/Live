import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket, broadcastActiveStreams, broadcastOnlineUsers } from './socketHandler';
import { memoryStore } from '../store/memoryStore';
import { SOCKET_EVENTS } from '../../shared/events';
import { Logger } from '../utils/logger';

export function registerStreamHandlers(io: SocketIOServer, socket: AuthenticatedSocket) {
  const user = socket.user;
  if (!user) return;

  const handleStartStream = ({ title }: { title: string }, ack?: (res: unknown) => void) => {
    try {
      const room = memoryStore.createStreamRoom(user.id, title);
      socket.join(room.id);

      Logger.info('Stream', `User ${user.email} started stream "${room.title}"`);

      if (ack) ack({ success: true, room });
      io.emit(SOCKET_EVENTS.STREAM_STARTED, room);
      io.emit(SOCKET_EVENTS.STREAM_CREATED, room);
      broadcastActiveStreams(io);
      broadcastOnlineUsers(io);
    } catch (err) {
      Logger.error('Stream', 'Error starting stream', err);
      if (ack) ack({ success: false, error: 'Failed to start stream' });
    }
  };

  const handleStopStream = (ack?: (res: unknown) => void) => {
    try {
      const room = memoryStore.getStreamRoom(user.id);
      if (room) {
        memoryStore.deleteStreamRoom(user.id);
        socket.leave(room.id);

        Logger.info('Stream', `User ${user.email} stopped stream`);

        io.emit(SOCKET_EVENTS.STREAM_STOPPED, { roomId: user.id });
        io.emit(SOCKET_EVENTS.STREAM_ENDED, { roomId: user.id });
        broadcastActiveStreams(io);
        broadcastOnlineUsers(io);
      }
      if (ack) ack({ success: true });
    } catch (err) {
      Logger.error('Stream', 'Error stopping stream', err);
      if (ack) ack({ success: false, error: 'Failed to stop stream' });
    }
  };

  // Start Live Public Stream
  socket.on(SOCKET_EVENTS.START_STREAM, handleStartStream);
  socket.on(SOCKET_EVENTS.STREAM_CREATE, handleStartStream);

  // Stop Live Public Stream
  socket.on(SOCKET_EVENTS.STOP_STREAM, handleStopStream);
  socket.on(SOCKET_EVENTS.STREAM_END, handleStopStream);

  // Join Stream as Viewer
  socket.on(SOCKET_EVENTS.JOIN_STREAM, ({ roomId }: { roomId: string }, ack?: (res: unknown) => void) => {
    try {
      const room = memoryStore.getStreamRoom(roomId);
      if (!room) {
        if (ack) ack({ success: false, error: 'Stream not found' });
        return;
      }

      memoryStore.addViewerToRoom(roomId, user.id);
      socket.join(roomId);

      Logger.info('Stream', `User ${user.email} joined stream ${roomId}`);

      // Notify streamer that new viewer joined
      const streamer = memoryStore.getUser(room.streamerId);
      if (streamer?.socketId) {
        io.to(streamer.socketId).emit(SOCKET_EVENTS.VIEWER_JOINED, {
          viewerId: user.id,
          viewerName: user.username,
          viewerEmail: user.email,
        });
      }

      broadcastActiveStreams(io);
      broadcastOnlineUsers(io);

      if (ack) ack({ success: true, room });
    } catch (err) {
      Logger.error('Stream', 'Error joining stream', err);
      if (ack) ack({ success: false, error: 'Failed to join stream' });
    }
  });

  // Leave Stream
  socket.on(SOCKET_EVENTS.LEAVE_STREAM, ({ roomId }: { roomId: string }) => {
    try {
      memoryStore.removeViewerFromRoom(roomId, user.id);
      socket.leave(roomId);

      const room = memoryStore.getStreamRoom(roomId);
      if (room) {
        const streamer = memoryStore.getUser(room.streamerId);
        if (streamer?.socketId) {
          io.to(streamer.socketId).emit(SOCKET_EVENTS.VIEWER_LEFT, {
            viewerId: user.id,
          });
        }
      }

      broadcastActiveStreams(io);
      broadcastOnlineUsers(io);
    } catch (err) {
      Logger.error('Stream', 'Error leaving stream', err);
    }
  });
}
