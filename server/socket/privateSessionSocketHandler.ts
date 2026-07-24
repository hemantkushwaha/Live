import { Server as SocketIOServer, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../../shared/events';
import { sessionStore } from '../store/sessionStore';
import { presenceService } from '../services/presenceService';
import { privateSessionService } from '../services/privateSessionService';
import { Logger } from '../utils/logger';

export function registerPrivateSessionSocketHandlers(io: SocketIOServer, socket: Socket) {
  /**
   * Helper to get authenticated user from session token
   */
  const getAuthenticatedUser = (tokenFromData?: string) => {
    const token = tokenFromData || (socket.handshake.auth?.token as string);
    if (!token) return null;
    const session = sessionStore.getSession(token);
    return session?.user || null;
  };

  /**
   * Client Event: private:start
   * Creator or client initiates private call session after request is accepted
   */
  socket.on(
    SOCKET_EVENTS.PRIVATE_START,
    (data: { requestId: string; streamId?: string; token?: string }) => {
      try {
        const user = getAuthenticatedUser(data?.token);
        if (!user) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required to start private session' });
          return;
        }

        const { requestId } = data || {};
        if (!requestId) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'requestId is required to start private session' });
          return;
        }

        const session = privateSessionService.startSession(requestId, user.id);

        const onlineUsers = presenceService.getOnlineUsers();
        const creatorUser = onlineUsers.find((u) => u.userId === session.creatorId);
        const viewerUser = onlineUsers.find((u) => u.userId === session.viewerId);

        const payload = {
          session,
          sessionId: session.id,
          requestId: session.requestId,
          creatorId: session.creatorId,
          viewerId: session.viewerId,
          streamId: session.streamId,
        };

        if (creatorUser?.socketId) {
          io.to(creatorUser.socketId).emit(SOCKET_EVENTS.PRIVATE_STARTED, payload);
          io.to(creatorUser.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_STARTED, payload);
        }

        if (viewerUser?.socketId) {
          io.to(viewerUser.socketId).emit(SOCKET_EVENTS.PRIVATE_STARTED, payload);
          io.to(viewerUser.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_STARTED, payload);
        }

        Logger.info('PrivateSessionSocket', `Emitted private:started for session ${session.id}`);
      } catch (err: any) {
        Logger.error('PrivateSessionSocket', 'Error in private:start', err);
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to start private session' });
      }
    }
  );

  /**
   * Client Event: private:end
   * Creator or Viewer ends private call session
   */
  socket.on(
    SOCKET_EVENTS.PRIVATE_END,
    (data: { sessionId: string; token?: string }) => {
      try {
        const user = getAuthenticatedUser(data?.token);
        if (!user) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required to end private session' });
          return;
        }

        const { sessionId } = data || {};
        if (!sessionId) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'sessionId is required to end private session' });
          return;
        }

        const session = privateSessionService.endSession(sessionId, user.id);

        const onlineUsers = presenceService.getOnlineUsers();
        const creatorUser = onlineUsers.find((u) => u.userId === session.creatorId);
        const viewerUser = onlineUsers.find((u) => u.userId === session.viewerId);

        const payload = {
          session,
          sessionId: session.id,
          requestId: session.requestId,
          creatorId: session.creatorId,
          viewerId: session.viewerId,
          streamId: session.streamId,
          endedBy: user.id,
        };

        if (creatorUser?.socketId) {
          io.to(creatorUser.socketId).emit(SOCKET_EVENTS.PRIVATE_ENDED, payload);
          io.to(creatorUser.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_ENDED, payload);
        }

        if (viewerUser?.socketId) {
          io.to(viewerUser.socketId).emit(SOCKET_EVENTS.PRIVATE_ENDED, payload);
          io.to(viewerUser.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_ENDED, payload);
        }

        Logger.info('PrivateSessionSocket', `Emitted private:ended for session ${session.id}`);
      } catch (err: any) {
        Logger.error('PrivateSessionSocket', 'Error in private:end', err);
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to end private session' });
      }
    }
  );

  /**
   * Client Event: private:offer
   * Peer sends WebRTC Offer for 1-on-1 private call
   */
  socket.on(
    SOCKET_EVENTS.PRIVATE_OFFER,
    (data: { sessionId: string; targetUserId: string; offer: RTCSessionDescriptionInit; token?: string }) => {
      try {
        const user = getAuthenticatedUser(data?.token);
        if (!user) return;

        const { sessionId, targetUserId, offer } = data || {};
        if (!sessionId || !targetUserId || !offer) return;

        const onlineUsers = presenceService.getOnlineUsers();
        const targetUser = onlineUsers.find((u) => u.userId === targetUserId);

        if (targetUser && targetUser.socketId) {
          io.to(targetUser.socketId).emit(SOCKET_EVENTS.PRIVATE_OFFER, {
            sessionId,
            senderUserId: user.id,
            senderEmail: user.email,
            offer,
          });
          Logger.info('PrivateSessionSocket', `Private Offer relayed from ${user.id} to ${targetUserId}`);
        }
      } catch (err: any) {
        Logger.error('PrivateSessionSocket', 'Error in PRIVATE_OFFER', err);
      }
    }
  );

  /**
   * Client Event: private:answer
   * Peer sends WebRTC Answer for 1-on-1 private call
   */
  socket.on(
    SOCKET_EVENTS.PRIVATE_ANSWER,
    (data: { sessionId: string; targetUserId: string; answer: RTCSessionDescriptionInit; token?: string }) => {
      try {
        const user = getAuthenticatedUser(data?.token);
        if (!user) return;

        const { sessionId, targetUserId, answer } = data || {};
        if (!sessionId || !targetUserId || !answer) return;

        const onlineUsers = presenceService.getOnlineUsers();
        const targetUser = onlineUsers.find((u) => u.userId === targetUserId);

        if (targetUser && targetUser.socketId) {
          io.to(targetUser.socketId).emit(SOCKET_EVENTS.PRIVATE_ANSWER, {
            sessionId,
            senderUserId: user.id,
            senderEmail: user.email,
            answer,
          });
          Logger.info('PrivateSessionSocket', `Private Answer relayed from ${user.id} to ${targetUserId}`);
        }
      } catch (err: any) {
        Logger.error('PrivateSessionSocket', 'Error in PRIVATE_ANSWER', err);
      }
    }
  );

  /**
   * Client Event: private:ice-candidate
   * Peer sends WebRTC ICE Candidate for 1-on-1 private call
   */
  socket.on(
    SOCKET_EVENTS.PRIVATE_ICE_CANDIDATE,
    (data: { sessionId: string; targetUserId: string; candidate: RTCIceCandidateInit; token?: string }) => {
      try {
        const user = getAuthenticatedUser(data?.token);
        if (!user) return;

        const { sessionId, targetUserId, candidate } = data || {};
        if (!sessionId || !targetUserId || !candidate) return;

        const onlineUsers = presenceService.getOnlineUsers();
        const targetUser = onlineUsers.find((u) => u.userId === targetUserId);

        if (targetUser && targetUser.socketId) {
          io.to(targetUser.socketId).emit(SOCKET_EVENTS.PRIVATE_ICE_CANDIDATE, {
            sessionId,
            senderUserId: user.id,
            candidate,
          });
        }
      } catch (err: any) {
        Logger.error('PrivateSessionSocket', 'Error in PRIVATE_ICE_CANDIDATE', err);
      }
    }
  );
}

/**
 * Handle disconnect for active private session cleanup
 */
export function handlePrivateSessionDisconnect(io: SocketIOServer, userId: string) {
  const endedSession = privateSessionService.handleUserDisconnect(userId);
  if (endedSession) {
    const onlineUsers = presenceService.getOnlineUsers();
    const creatorUser = onlineUsers.find((u) => u.userId === endedSession.creatorId);
    const viewerUser = onlineUsers.find((u) => u.userId === endedSession.viewerId);

    const payload = {
      session: endedSession,
      sessionId: endedSession.id,
      requestId: endedSession.requestId,
      creatorId: endedSession.creatorId,
      viewerId: endedSession.viewerId,
      streamId: endedSession.streamId,
      endedBy: userId,
      reason: 'user_disconnected',
    };

    if (creatorUser?.socketId) {
      io.to(creatorUser.socketId).emit(SOCKET_EVENTS.PRIVATE_ENDED, payload);
      io.to(creatorUser.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_ENDED, payload);
    }

    if (viewerUser?.socketId) {
      io.to(viewerUser.socketId).emit(SOCKET_EVENTS.PRIVATE_ENDED, payload);
      io.to(viewerUser.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_ENDED, payload);
    }
  }
}
