import { Server as SocketIOServer, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../../shared/events';
import { StreamRoom } from '../../shared/types';
import { sessionStore } from '../store/sessionStore';
import { presenceService } from '../services/presenceService';
import { lobbyService } from '../services/lobbyService';
import { streamService } from '../services/streamService';
import { registerSignalingSocketHandlers, handleSignalingUserDisconnect } from './signalingSocketHandler';
import { registerPrivateRequestSocketHandlers } from './privateRequestSocketHandler';
import { registerCreatorEconomySocketHandlers } from './creatorEconomySocketHandler';
import { registerPrivateSessionSocketHandlers, handlePrivateSessionDisconnect } from './privateSessionSocketHandler';
import { privateRequestService } from '../services/privateRequestService';
import { billingService } from '../services/billingService';
import { Logger } from '../utils/logger';

let globalIo: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return globalIo;
}

export function broadcastStreamUpdate(streamRoom?: StreamRoom, eventType?: 'started' | 'ended') {
  if (globalIo) {
    const activeStreams = streamService.getAllStreams();
    const onlineUsers = presenceService.getOnlineUsers();

    if (eventType === 'started' && streamRoom) {
      globalIo.emit(SOCKET_EVENTS.STREAM_STARTED, streamRoom);
    } else if (eventType === 'ended' && streamRoom) {
      globalIo.emit(SOCKET_EVENTS.STREAM_ENDED, { streamId: streamRoom.id, streamerId: streamRoom.streamerId });
      globalIo.to(`stream:${streamRoom.id}`).emit(SOCKET_EVENTS.STREAM_ENDED, { streamId: streamRoom.id, streamerId: streamRoom.streamerId });
    }

    globalIo.emit(SOCKET_EVENTS.STREAM_LIST_UPDATED, activeStreams);
    globalIo.emit(SOCKET_EVENTS.ACTIVE_STREAMS_LIST, activeStreams);
    globalIo.emit(SOCKET_EVENTS.LOBBY_UPDATE, {
      onlineUsers,
      activeStreams,
    });
  }
}

export function broadcastPresenceUpdate() {
  if (globalIo) {
    const onlineUsers = presenceService.getOnlineUsers();
    const activeStreams = lobbyService.getActiveStreams();

    globalIo.emit(SOCKET_EVENTS.PRESENCE_ONLINE_USERS, onlineUsers);
    globalIo.emit(SOCKET_EVENTS.LOBBY_UPDATE, {
      onlineUsers,
      activeStreams,
    });
  }
}

export function initSocketServer(io: SocketIOServer) {
  globalIo = io;
  billingService.setSocketServer(io);

  // EWO-027 Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : undefined);

      if (!token) {
        Logger.warn('SocketAuth', `Socket connection rejected for ${socket.id}: No authentication token provided.`);
        return next(new Error('Authentication required: Token missing'));
      }

      // Verify token via AuthService / SecurityService
      const session = sessionStore.getSession(token);
      if (!session || !session.user) {
        Logger.warn('SocketAuth', `Socket connection rejected for ${socket.id}: Invalid or expired token.`);
        return next(new Error('Authentication failed: Invalid or expired token'));
      }

      // Attach authenticated user to socket data
      (socket as any).user = session.user;
      (socket as any).token = token;
      next();
    } catch (err: any) {
      Logger.error('SocketAuth', `Socket authentication error for ${socket.id}`, err);
      return next(new Error('Authentication failed: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    Logger.info('Socket', `Client connected: ID ${socket.id}`);

    // Register WebRTC Signaling Socket Handlers (EWO-009)
    registerSignalingSocketHandlers(io, socket);

    // Register Private Request Socket Handlers (EWO-011)
    registerPrivateRequestSocketHandlers(io, socket);

    // Register Creator Economy Socket Handlers (PRD Amendment 2)
    registerCreatorEconomySocketHandlers(io, socket);

    // Register Private Session Socket Handlers (EWO-016)
    registerPrivateSessionSocketHandlers(io, socket);

    /**
     * Client joins presence stream
     * Payload: { token: string }
     */
    socket.on(SOCKET_EVENTS.PRESENCE_JOIN, (data: { token?: string }) => {
      try {
        const token = data?.token || (socket.handshake.auth?.token as string);
        if (!token) {
          Logger.warn('Socket', `Rejected unauthenticated presence:join from socket ${socket.id}: No token provided`);
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication token required for presence' });
          return;
        }

        const session = sessionStore.getSession(token);
        if (!session || !session.user) {
          Logger.warn('Socket', `Rejected unauthenticated presence:join from socket ${socket.id}: Invalid token`);
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid session token' });
          return;
        }

        const user = session.user;
        const presenceUser = presenceService.addPresence(socket.id, user);

        // Send full online users list to the joining user
        const onlineUsers = presenceService.getOnlineUsers();
        socket.emit(SOCKET_EVENTS.PRESENCE_ONLINE_USERS, onlineUsers);

        // Notify all other clients that a new user joined
        socket.broadcast.emit(SOCKET_EVENTS.PRESENCE_USER_JOINED, presenceUser);
        socket.broadcast.emit(SOCKET_EVENTS.CREATOR_ONLINE, {
          creatorId: user.id,
          username: user.username,
          timestamp: Date.now(),
        });

        // Broadcast updated online users list and lobby update to all clients
        broadcastPresenceUpdate();

        Logger.info('Socket', `Presence registered for ${user.email} on socket ${socket.id}`);
      } catch (err: any) {
        Logger.error('Socket', `Error handling presence:join for socket ${socket.id}`, err);
      }
    });

    /**
     * Client joins Live Lobby
     * Payload: { token: string }
     */
    socket.on(SOCKET_EVENTS.LOBBY_JOIN, (data: { token?: string }) => {
      try {
        const token = data?.token || (socket.handshake.auth?.token as string);
        if (!token) {
          Logger.warn('Socket', `Rejected unauthenticated lobby:join from socket ${socket.id}: No token provided`);
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication token required for lobby' });
          return;
        }

        const session = sessionStore.getSession(token);
        if (!session || !session.user) {
          Logger.warn('Socket', `Rejected unauthenticated lobby:join from socket ${socket.id}: Invalid token`);
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid session token' });
          return;
        }

        socket.join('lobby');

        const lobbyState = {
          onlineUsers: presenceService.getOnlineUsers(),
          activeStreams: lobbyService.getActiveStreams(),
        };

        // Emit lobby:update to joining client
        socket.emit(SOCKET_EVENTS.LOBBY_UPDATE, lobbyState);

        Logger.info('Socket', `User ${session.user.email} joined lobby on socket ${socket.id}`);
      } catch (err: any) {
        Logger.error('Socket', `Error handling lobby:join for socket ${socket.id}`, err);
      }
    });

    /**
     * Socket Event: stream:start
     * Payload: { token?: string, title?: string }
     */
    socket.on(SOCKET_EVENTS.START_STREAM, (data: { token?: string; title?: string }) => {
      try {
        const token = data?.token || (socket.handshake.auth?.token as string);
        if (!token) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required to start stream' });
          return;
        }

        const session = sessionStore.getSession(token);
        if (!session || !session.user) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid session token' });
          return;
        }

        const stream = streamService.startStream(session.user, data?.title);
        broadcastStreamUpdate(stream, 'started');
        socket.emit(SOCKET_EVENTS.STREAM_STARTED, stream);
        Logger.info('Socket', `Stream started via socket by ${session.user.email}: ${stream.id}`);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to start stream' });
      }
    });

    /**
     * Socket Event: stream:end
     * Payload: { token?: string }
     */
    socket.on(SOCKET_EVENTS.STREAM_END, (data: { token?: string }) => {
      try {
        const token = data?.token || (socket.handshake.auth?.token as string);
        if (!token) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required to end stream' });
          return;
        }

        const session = sessionStore.getSession(token);
        if (!session || !session.user) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid session token' });
          return;
        }

        const endedStream = streamService.endStream(session.user.id);
        privateRequestService.handleStreamEnded(endedStream.id);
        broadcastStreamUpdate(endedStream, 'ended');
        socket.emit(SOCKET_EVENTS.STREAM_ENDED, { streamId: endedStream.id });
        Logger.info('Socket', `Stream ended via socket by ${session.user.email}: ${endedStream.id}`);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to end stream' });
      }
    });

    /**
     * Client heartbeat event
     */
    socket.on(SOCKET_EVENTS.PRESENCE_HEARTBEAT, () => {
      presenceService.updateHeartbeat(socket.id);
    });

    /**
     * Handle client disconnect
     */
    socket.on('disconnect', (reason) => {
      Logger.info('Socket', `Client disconnected: ID ${socket.id} (Reason: ${reason})`);

      const removedUser = presenceService.removePresenceBySocketId(socket.id);
      if (removedUser) {
        // Clean up WebRTC signaling sessions
        handleSignalingUserDisconnect(io, removedUser.userId);
        handlePrivateSessionDisconnect(io, removedUser.userId);

        // Also check if user was actively hosting a stream
        const removedStream = streamService.removeStreamByUserId(removedUser.userId);
        if (removedStream) {
          broadcastStreamUpdate(removedStream, 'ended');
          Logger.info('Socket', `Cleaned up stream ${removedStream.id} for disconnected host ${removedUser.email}`);
        }

        // Broadcast user-left event
        io.emit(SOCKET_EVENTS.PRESENCE_USER_LEFT, {
          userId: removedUser.userId,
          email: removedUser.email,
        });
        io.emit(SOCKET_EVENTS.CREATOR_OFFLINE, {
          creatorId: removedUser.userId,
          timestamp: Date.now(),
        });

        // Broadcast updated online users & lobby update
        broadcastPresenceUpdate();

        Logger.info('Socket', `Broadcasted presence departure for ${removedUser.email}`);
      }
    });
  });
}
