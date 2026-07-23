import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { memoryStore } from '../store/memoryStore';
import { SOCKET_EVENTS } from '../../shared/events';
import { User } from '../../shared/types';
import { Logger } from '../utils/logger';
import { registerStreamHandlers } from './streamHandler';
import { registerWebRtcHandlers } from './webrtcHandler';
import { registerPrivateCallHandlers } from './privateCallHandler';

export interface AuthenticatedSocket extends Socket {
  user?: User;
}

export function initSocketServer(io: SocketIOServer) {
  // Authentication Middleware for Socket.io Handshake
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      Logger.warn('SocketAuth', 'Connection attempt missing token');
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; email: string; username: string };
      let user = memoryStore.getUser(decoded.id);

      if (!user) {
        user = {
          id: decoded.id,
          email: decoded.email,
          username: decoded.username,
          status: 'idle',
          socketId: socket.id,
          connectedAt: Date.now(),
        };
      } else {
        user.socketId = socket.id;
        user.status = user.status || 'idle';
      }

      memoryStore.setUser(user);
      socket.user = user;
      next();
    } catch (err) {
      Logger.error('SocketAuth', 'Invalid socket token', err);
      next(new Error('Invalid token'));
    }
  });

  // Connection Handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) return;

    Logger.info('Socket', `User connected: ${user.email} (Socket ID: ${socket.id})`);

    // Broadcast updated online users list
    broadcastOnlineUsers(io);
    broadcastActiveStreams(io);

    // Register modular feature handlers
    registerStreamHandlers(io, socket);
    registerWebRtcHandlers(io, socket);
    registerPrivateCallHandlers(io, socket);

    // Explicit request for online users
    socket.on(SOCKET_EVENTS.GET_ONLINE_USERS, () => {
      socket.emit(SOCKET_EVENTS.ONLINE_USERS_LIST, memoryStore.getOnlineUsers());
    });

    // Disconnect Handler
    socket.on('disconnect', () => {
      Logger.info('Socket', `User disconnected: ${user.email} (${socket.id})`);

      // Cleanup stream room if user was streamer
      const streamRoom = memoryStore.getStreamRoom(user.id);
      if (streamRoom) {
        memoryStore.deleteStreamRoom(user.id);
        io.emit(SOCKET_EVENTS.STREAM_STOPPED, { roomId: user.id });
        broadcastActiveStreams(io);
      }

      // Cleanup active call if user was in a private call
      const activeCall = memoryStore.getActiveCallByUserId(user.id);
      if (activeCall) {
        memoryStore.endCallSession(activeCall.id);
        const partnerId = activeCall.streamerId === user.id ? activeCall.viewerId : activeCall.streamerId;
        const partnerUser = memoryStore.getUser(partnerId);
        if (partnerUser?.socketId) {
          io.to(partnerUser.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_ENDED, {
            sessionId: activeCall.id,
            reason: 'Peer disconnected',
          });
        }
      }

      memoryStore.removeUserSocket(socket.id);
      broadcastOnlineUsers(io);
    });
  });
}

export function broadcastOnlineUsers(io: SocketIOServer) {
  const onlineUsers = memoryStore.getOnlineUsers();
  io.emit(SOCKET_EVENTS.ONLINE_USERS_LIST, onlineUsers);
}

export function broadcastActiveStreams(io: SocketIOServer) {
  const activeStreams = memoryStore.getActiveStreams();
  io.emit(SOCKET_EVENTS.ACTIVE_STREAMS_LIST, activeStreams);
}
