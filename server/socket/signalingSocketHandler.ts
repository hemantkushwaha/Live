import { Server as SocketIOServer, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../../shared/events';
import { sessionStore } from '../store/sessionStore';
import { presenceService } from '../services/presenceService';
import { signalingService } from '../services/signalingService';
import { streamService } from '../services/streamService';
import { Logger } from '../utils/logger';

export function registerSignalingSocketHandlers(io: SocketIOServer, socket: Socket) {
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
   * Client Event: webrtc:join-stream
   * Viewer requests to join stream signaling
   */
  socket.on(SOCKET_EVENTS.WEBRTC_JOIN_STREAM, (data: { streamId: string; token?: string }) => {
    try {
      const user = getAuthenticatedUser(data?.token);
      if (!user) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required for WebRTC signaling' });
        return;
      }

      const { streamId } = data || {};
      if (!streamId) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'streamId is required to join WebRTC signaling' });
        return;
      }

      const { hostUserId, session } = signalingService.joinStream(streamId, user.id, socket.id);

      // Record viewer in streamService
      const updatedStream = streamService.addViewer(streamId, user.id);

      // Join socket room for this stream
      socket.join(`stream:${streamId}`);

      // Broadcast updated stream list to everyone for viewer counts
      io.emit(SOCKET_EVENTS.STREAM_LIST_UPDATED, streamService.getAllStreams());

      // Notify viewers/host in stream room
      io.to(`stream:${streamId}`).emit(SOCKET_EVENTS.VIEWER_JOINED, {
        streamId,
        viewerUserId: user.id,
        viewerEmail: user.email,
        viewerCount: updatedStream.viewers.length,
      });

      // Find host socket and notify host directly for WebRTC offer creation
      const onlineUsers = presenceService.getOnlineUsers();
      const hostUser = onlineUsers.find((u) => u.userId === hostUserId);

      if (hostUser && hostUser.socketId) {
        io.to(hostUser.socketId).emit(SOCKET_EVENTS.WEBRTC_USER_JOINED, {
          streamId,
          viewerUserId: user.id,
          viewerEmail: user.email,
          viewerSocketId: socket.id,
        });
      }

      Logger.info('SignalingSocket', `User ${user.email} joined stream ${streamId} WebRTC signaling`);
    } catch (err: any) {
      Logger.error('SignalingSocket', 'Error in WEBRTC_JOIN_STREAM', err);
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to join WebRTC stream signaling' });
    }
  });

  /**
   * Client Event: webrtc:leave-stream
   * Viewer requests to leave stream signaling
   */
  socket.on(SOCKET_EVENTS.WEBRTC_LEAVE_STREAM, (data: { streamId: string; token?: string }) => {
    try {
      const user = getAuthenticatedUser(data?.token);
      if (!user) return;

      const { streamId } = data || {};
      if (!streamId) return;

      const session = signalingService.leaveStream(streamId, user.id);
      const updatedStream = streamService.removeViewer(streamId, user.id);
      socket.leave(`stream:${streamId}`);

      if (session) {
        // Broadcast updated streams
        io.emit(SOCKET_EVENTS.STREAM_LIST_UPDATED, streamService.getAllStreams());

        // Notify stream room
        io.to(`stream:${streamId}`).emit(SOCKET_EVENTS.VIEWER_LEFT, {
          streamId,
          viewerUserId: user.id,
          viewerCount: updatedStream ? updatedStream.viewers.length : 0,
        });

        const onlineUsers = presenceService.getOnlineUsers();
        const hostUser = onlineUsers.find((u) => u.userId === session.hostUserId);

        if (hostUser && hostUser.socketId) {
          io.to(hostUser.socketId).emit(SOCKET_EVENTS.WEBRTC_USER_LEFT, {
            streamId,
            viewerUserId: user.id,
          });
        }
      }

      Logger.info('SignalingSocket', `User ${user.email} left stream ${streamId} WebRTC signaling`);
    } catch (err: any) {
      Logger.error('SignalingSocket', 'Error in WEBRTC_LEAVE_STREAM', err);
    }
  });

  /**
   * Client Event: webrtc:offer
   * Peer sends WebRTC Offer SDP
   */
  socket.on(
    SOCKET_EVENTS.WEBRTC_OFFER,
    (data: { streamId: string; targetUserId: string; offer: RTCSessionDescriptionInit; token?: string }) => {
      try {
        const user = getAuthenticatedUser(data?.token);
        if (!user) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required' });
          return;
        }

        const { streamId, targetUserId, offer } = data || {};
        if (!streamId || !targetUserId || !offer) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid WEBRTC_OFFER payload parameters' });
          return;
        }

        const onlineUsers = presenceService.getOnlineUsers();
        const targetUser = onlineUsers.find((u) => u.userId === targetUserId);

        if (targetUser && targetUser.socketId) {
          io.to(targetUser.socketId).emit(SOCKET_EVENTS.WEBRTC_OFFER, {
            streamId,
            senderUserId: user.id,
            senderEmail: user.email,
            offer,
          });
          Logger.info('SignalingSocket', `WebRTC Offer relayed from ${user.id} to ${targetUserId}`);
        } else {
          socket.emit(SOCKET_EVENTS.ERROR, { message: `Target peer ${targetUserId} is offline or unavailable` });
        }
      } catch (err: any) {
        Logger.error('SignalingSocket', 'Error in WEBRTC_OFFER', err);
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to relay WebRTC offer' });
      }
    }
  );

  /**
   * Client Event: webrtc:answer
   * Peer sends WebRTC Answer SDP
   */
  socket.on(
    SOCKET_EVENTS.WEBRTC_ANSWER,
    (data: { streamId: string; targetUserId: string; answer: RTCSessionDescriptionInit; token?: string }) => {
      try {
        const user = getAuthenticatedUser(data?.token);
        if (!user) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required' });
          return;
        }

        const { streamId, targetUserId, answer } = data || {};
        if (!streamId || !targetUserId || !answer) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid WEBRTC_ANSWER payload parameters' });
          return;
        }

        const onlineUsers = presenceService.getOnlineUsers();
        const targetUser = onlineUsers.find((u) => u.userId === targetUserId);

        if (targetUser && targetUser.socketId) {
          io.to(targetUser.socketId).emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
            streamId,
            senderUserId: user.id,
            senderEmail: user.email,
            answer,
          });
          Logger.info('SignalingSocket', `WebRTC Answer relayed from ${user.id} to ${targetUserId}`);
        } else {
          socket.emit(SOCKET_EVENTS.ERROR, { message: `Target peer ${targetUserId} is offline or unavailable` });
        }
      } catch (err: any) {
        Logger.error('SignalingSocket', 'Error in WEBRTC_ANSWER', err);
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to relay WebRTC answer' });
      }
    }
  );

  /**
   * Client Event: webrtc:ice-candidate
   * Peer sends WebRTC ICE Candidate
   */
  socket.on(
    SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE,
    (data: { streamId: string; targetUserId: string; candidate: RTCIceCandidateInit; token?: string }) => {
      try {
        const user = getAuthenticatedUser(data?.token);
        if (!user) return;

        const { streamId, targetUserId, candidate } = data || {};
        if (!streamId || !targetUserId || !candidate) return;

        const onlineUsers = presenceService.getOnlineUsers();
        const targetUser = onlineUsers.find((u) => u.userId === targetUserId);

        if (targetUser && targetUser.socketId) {
          io.to(targetUser.socketId).emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, {
            streamId,
            senderUserId: user.id,
            candidate,
          });
        }
      } catch (err: any) {
        Logger.error('SignalingSocket', 'Error in WEBRTC_ICE_CANDIDATE', err);
      }
    }
  );
}

/**
   * Handle user disconnection cleanup for WebRTC signaling
   */
export function handleSignalingUserDisconnect(io: SocketIOServer, userId: string) {
  const cleaned = signalingService.handleUserDisconnect(userId);
  const onlineUsers = presenceService.getOnlineUsers();

  for (const session of cleaned) {
    const hostUser = onlineUsers.find((u) => u.userId === session.hostUserId);
    if (hostUser && hostUser.socketId) {
      io.to(hostUser.socketId).emit(SOCKET_EVENTS.WEBRTC_USER_LEFT, {
        streamId: session.streamId,
        viewerUserId: session.viewerUserId,
      });
    }

    const viewerUser = onlineUsers.find((u) => u.userId === session.viewerUserId);
    if (viewerUser && viewerUser.socketId) {
      io.to(viewerUser.socketId).emit(SOCKET_EVENTS.WEBRTC_USER_LEFT, {
        streamId: session.streamId,
        viewerUserId: session.viewerUserId,
      });
    }
  }
}
