import { Server as SocketIOServer, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../../shared/events';
import { PrivateCallRequest } from '../../shared/types';
import { sessionStore } from '../store/sessionStore';
import { presenceService } from '../services/presenceService';
import { privateRequestService } from '../services/privateRequestService';
import { Logger } from '../utils/logger';

let isServiceSubscribed = false;

export function registerPrivateRequestSocketHandlers(io: SocketIOServer, socket: Socket) {
  // Subscribe PrivateRequestService events to Socket.io broadcast once
  if (!isServiceSubscribed) {
    isServiceSubscribed = true;

    privateRequestService.onEvent((event, request) => {
      broadcastRequestEvent(io, event, request);
    });
  }

  /**
   * Client Socket Event: private:request
   * Payload: { token?: string, streamId: string, requestedDuration?: number }
   */
  socket.on(
    SOCKET_EVENTS.PRIVATE_REQUEST,
    (data: { token?: string; streamId: string; requestedDuration?: number; duration?: number }) => {
      try {
        const token = data?.token || (socket.handshake.auth?.token as string);
        if (!token) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required to send request' });
          return;
        }

        const session = sessionStore.getSession(token);
        if (!session || !session.user) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid session token' });
          return;
        }

        if (!data?.streamId) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'streamId is required' });
          return;
        }

        const duration = Number(data.requestedDuration || data.duration || 5);

        try {
          const request = privateRequestService.createRequest(session.user, data.streamId, duration);
          Logger.info(
            'PrivateRequestSocket',
            `Request ${request.id} (${duration} mins, ${request.estimatedCost} Coins) created via socket by ${session.user.email}`
          );
        } catch (err: any) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to send request' });
        }
      } catch (err: any) {
        Logger.error('PrivateRequestSocket', 'Error handling private:request', err);
      }
    }
  );

  /**
   * Client Socket Event: private:cancel
   * Payload: { token?: string, requestId: string }
   */
  socket.on(SOCKET_EVENTS.PRIVATE_CANCEL, (data: { token?: string; requestId: string }) => {
    try {
      const token = data?.token || (socket.handshake.auth?.token as string);
      if (!token) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required to cancel request' });
        return;
      }

      const session = sessionStore.getSession(token);
      if (!session || !session.user) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid session token' });
        return;
      }

      if (!data?.requestId) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'requestId is required' });
        return;
      }

      try {
        const request = privateRequestService.cancelRequest(data.requestId, session.user.id);
        Logger.info('PrivateRequestSocket', `Request ${request.id} cancelled via socket by ${session.user.email}`);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to cancel request' });
      }
    } catch (err: any) {
      Logger.error('PrivateRequestSocket', 'Error handling private:cancel', err);
    }
  });

  /**
   * Client Socket Event: private:accept
   * Payload: { token?: string, requestId: string }
   */
  socket.on(SOCKET_EVENTS.PRIVATE_ACCEPT, (data: { token?: string; requestId: string }) => {
    try {
      const token = data?.token || (socket.handshake.auth?.token as string);
      if (!token) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required to accept request' });
        return;
      }

      const session = sessionStore.getSession(token);
      if (!session || !session.user) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid session token' });
        return;
      }

      if (!data?.requestId) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'requestId is required' });
        return;
      }

      try {
        const request = privateRequestService.acceptRequest(data.requestId, session.user.id);
        Logger.info('PrivateRequestSocket', `Request ${request.id} accepted via socket by creator ${session.user.email}`);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to accept request' });
      }
    } catch (err: any) {
      Logger.error('PrivateRequestSocket', 'Error handling private:accept', err);
    }
  });

  /**
   * Client Socket Event: private:reject
   * Payload: { token?: string, requestId: string }
   */
  socket.on(SOCKET_EVENTS.PRIVATE_REJECT, (data: { token?: string; requestId: string }) => {
    try {
      const token = data?.token || (socket.handshake.auth?.token as string);
      if (!token) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required to reject request' });
        return;
      }

      const session = sessionStore.getSession(token);
      if (!session || !session.user) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid session token' });
        return;
      }

      if (!data?.requestId) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'requestId is required' });
        return;
      }

      try {
        const request = privateRequestService.rejectRequest(data.requestId, session.user.id);
        Logger.info('PrivateRequestSocket', `Request ${request.id} rejected via socket by creator ${session.user.email}`);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to reject request' });
      }
    } catch (err: any) {
      Logger.error('PrivateRequestSocket', 'Error handling private:reject', err);
    }
  });

  /**
   * Client Socket Event: private:respond_call
   * Payload: { token?: string, requestId: string, action: 'accept' | 'reject' }
   */
  socket.on(SOCKET_EVENTS.RESPOND_PRIVATE_CALL, (data: { token?: string; requestId: string; action: 'accept' | 'reject' }) => {
    try {
      const token = data?.token || (socket.handshake.auth?.token as string);
      if (!token) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required to respond to request' });
        return;
      }

      const session = sessionStore.getSession(token);
      if (!session || !session.user) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid session token' });
        return;
      }

      if (!data?.requestId) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'requestId is required' });
        return;
      }

      try {
        if (data.action === 'accept') {
          privateRequestService.acceptRequest(data.requestId, session.user.id);
        } else {
          privateRequestService.rejectRequest(data.requestId, session.user.id);
        }
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to respond to request' });
      }
    } catch (err: any) {
      Logger.error('PrivateRequestSocket', 'Error handling private:respond_call', err);
    }
  });
}

/**
 * Helper to emit request events to relevant socket clients
 */
function broadcastRequestEvent(
  io: SocketIOServer,
  event: 'received' | 'updated' | 'expired' | 'accepted' | 'rejected' | 'queue-updated',
  request: PrivateCallRequest
) {
  const onlineUsers = presenceService.getOnlineUsers();
  const streamerPresence = onlineUsers.find((u) => u.userId === request.creatorId || u.userId === request.streamerId);
  const viewerPresence = onlineUsers.find((u) => u.userId === request.viewerId);

  const streamRoom = `stream:${request.streamId}`;
  const pendingRequests = privateRequestService.getPendingRequestsForStream(request.streamId);

  switch (event) {
    case 'received':
      if (streamerPresence?.socketId) {
        io.to(streamerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_REQUEST_RECEIVED, { request });
      }
      io.to(streamRoom).emit(SOCKET_EVENTS.PRIVATE_REQUEST_RECEIVED, { request });

      if (viewerPresence?.socketId) {
        io.to(viewerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_REQUEST_UPDATED, { request });
      }
      break;

    case 'updated':
      if (streamerPresence?.socketId) {
        io.to(streamerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_REQUEST_UPDATED, { request });
      }
      if (viewerPresence?.socketId) {
        io.to(viewerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_REQUEST_UPDATED, { request });
      }
      io.to(streamRoom).emit(SOCKET_EVENTS.PRIVATE_REQUEST_UPDATED, { request });
      break;

    case 'accepted':
      const acceptPayload = { request, requestId: request.id, streamId: request.streamId, status: 'Accepted' };
      if (viewerPresence?.socketId) {
        io.to(viewerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_ACCEPTED, acceptPayload);
        io.to(viewerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_ACCEPTED, acceptPayload);
        io.to(viewerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_REQUEST_UPDATED, { request });
      }
      if (streamerPresence?.socketId) {
        io.to(streamerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_ACCEPTED, acceptPayload);
        io.to(streamerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_ACCEPTED, acceptPayload);
        io.to(streamerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_REQUEST_UPDATED, { request });
      }
      io.to(streamRoom).emit(SOCKET_EVENTS.PRIVATE_ACCEPTED, acceptPayload);
      io.to(streamRoom).emit(SOCKET_EVENTS.PRIVATE_CALL_ACCEPTED, acceptPayload);
      io.to(streamRoom).emit(SOCKET_EVENTS.PRIVATE_REQUEST_UPDATED, { request });
      break;

    case 'rejected':
      const rejectPayload = { request, requestId: request.id, streamId: request.streamId, status: 'Rejected' };
      if (viewerPresence?.socketId) {
        io.to(viewerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_REJECTED, rejectPayload);
        io.to(viewerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_REJECTED, rejectPayload);
        io.to(viewerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_REQUEST_UPDATED, { request });
      }
      if (streamerPresence?.socketId) {
        io.to(streamerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_REJECTED, rejectPayload);
        io.to(streamerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_REJECTED, rejectPayload);
        io.to(streamerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_REQUEST_UPDATED, { request });
      }
      io.to(streamRoom).emit(SOCKET_EVENTS.PRIVATE_REJECTED, rejectPayload);
      io.to(streamRoom).emit(SOCKET_EVENTS.PRIVATE_CALL_REJECTED, rejectPayload);
      io.to(streamRoom).emit(SOCKET_EVENTS.PRIVATE_REQUEST_UPDATED, { request });
      break;

    case 'expired':
      const expirePayload = {
        requestId: request.id,
        streamId: request.streamId,
        status: 'Expired',
        request,
      };

      if (streamerPresence?.socketId) {
        io.to(streamerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_REQUEST_EXPIRED, expirePayload);
      }
      if (viewerPresence?.socketId) {
        io.to(viewerPresence.socketId).emit(SOCKET_EVENTS.PRIVATE_REQUEST_EXPIRED, expirePayload);
      }
      io.to(streamRoom).emit(SOCKET_EVENTS.PRIVATE_REQUEST_EXPIRED, expirePayload);
      break;
  }

  // Always emit private:queue-updated with current pending requests queue
  const queuePayload = {
    streamId: request.streamId,
    creatorId: request.creatorId,
    requests: pendingRequests,
    request,
  };
  io.to(streamRoom).emit('private:queue-updated', queuePayload);
  if (streamerPresence?.socketId) {
    io.to(streamerPresence.socketId).emit('private:queue-updated', queuePayload);
  }
}
