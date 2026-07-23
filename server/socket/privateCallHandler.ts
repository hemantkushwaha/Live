import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedSocket, broadcastActiveStreams, broadcastOnlineUsers } from './socketHandler';
import { memoryStore } from '../store/memoryStore';
import { SOCKET_EVENTS } from '../../shared/events';
import { PrivateCallRequest, CallSession } from '../../shared/types';
import { Logger } from '../utils/logger';

export function registerPrivateCallHandlers(io: SocketIOServer, socket: AuthenticatedSocket) {
  const user = socket.user;
  if (!user) return;

  // Viewer requests a private call with streamer
  socket.on(SOCKET_EVENTS.REQUEST_PRIVATE_CALL, ({ streamerId }: { streamerId: string }, ack?: (res: unknown) => void) => {
    try {
      const streamer = memoryStore.getUser(streamerId);
      if (!streamer || !streamer.socketId) {
        if (ack) ack({ success: false, error: 'Streamer is not online' });
        return;
      }

      if (streamer.status === 'in_private_call') {
        if (ack) ack({ success: false, error: 'Streamer is currently in a private call' });
        return;
      }

      const request: PrivateCallRequest = {
        id: `req_${uuidv4().substring(0, 8)}`,
        streamerId,
        viewerId: user.id,
        viewerName: user.username,
        viewerEmail: user.email,
        status: 'pending',
        createdAt: Date.now(),
      };

      memoryStore.createCallRequest(request);

      Logger.info('PrivateCall', `User ${user.email} requested private call with streamer ${streamerId}`);

      // Emit to streamer
      io.to(streamer.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_REQUESTED, request);

      if (ack) ack({ success: true, requestId: request.id });
    } catch (err) {
      Logger.error('PrivateCall', 'Error requesting private call', err);
      if (ack) ack({ success: false, error: 'Failed to send private call request' });
    }
  });

  // Streamer accepts or rejects private call request
  socket.on(
    SOCKET_EVENTS.RESPOND_PRIVATE_CALL,
    ({ requestId, accept }: { requestId: string; accept: boolean }, ack?: (res: unknown) => void) => {
      try {
        const request = memoryStore.getCallRequest(requestId);
        if (!request || request.streamerId !== user.id) {
          if (ack) ack({ success: false, error: 'Invalid or unauthorized request' });
          return;
        }

        const viewer = memoryStore.getUser(request.viewerId);
        if (!viewer || !viewer.socketId) {
          if (ack) ack({ success: false, error: 'Viewer is no longer connected' });
          return;
        }

        if (accept) {
          memoryStore.updateCallRequestStatus(requestId, 'accepted');

          // Pause public stream room
          memoryStore.setStreamPauseState(user.id, true);
          io.to(user.id).emit(SOCKET_EVENTS.STREAM_PAUSED_FOR_PRIVATE, {
            streamerId: user.id,
            message: 'Streamer is currently in a private 1-on-1 call. Stream will resume shortly.',
          });

          // Create active call session
          const session: CallSession = {
            id: `call_${uuidv4().substring(0, 8)}`,
            streamerId: user.id,
            viewerId: request.viewerId,
            startedAt: Date.now(),
            active: true,
          };
          memoryStore.createCallSession(session);

          Logger.info('PrivateCall', `Streamer ${user.email} accepted call from ${viewer.email}`);

          // Notify viewer
          io.to(viewer.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_ACCEPTED, {
            session,
            streamerId: user.id,
            streamerName: user.username,
          });

          // Notify streamer
          socket.emit(SOCKET_EVENTS.PRIVATE_CALL_STARTED, {
            session,
            peerId: request.viewerId,
            peerName: viewer.username,
            peerEmail: viewer.email,
          });

          broadcastActiveStreams(io);
          broadcastOnlineUsers(io);
        } else {
          memoryStore.updateCallRequestStatus(requestId, 'rejected');
          Logger.info('PrivateCall', `Streamer ${user.email} rejected call from ${viewer.email}`);

          io.to(viewer.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_REJECTED, {
            requestId,
            reason: 'Streamer declined the private call request.',
          });
        }

        if (ack) ack({ success: true });
      } catch (err) {
        Logger.error('PrivateCall', 'Error responding to private call request', err);
        if (ack) ack({ success: false, error: 'Failed to process request response' });
      }
    }
  );

  // End Private Call
  socket.on(SOCKET_EVENTS.END_PRIVATE_CALL, ({ sessionId }: { sessionId: string }, ack?: (res: unknown) => void) => {
    try {
      const session = memoryStore.getCallSession(sessionId);
      if (!session) {
        if (ack) ack({ success: false, error: 'Session not found' });
        return;
      }

      const partnerId = session.streamerId === user.id ? session.viewerId : session.streamerId;
      const partner = memoryStore.getUser(partnerId);

      memoryStore.endCallSession(sessionId);

      Logger.info('PrivateCall', `User ${user.email} ended private call session ${sessionId}`);

      // Notify partner
      if (partner?.socketId) {
        io.to(partner.socketId).emit(SOCKET_EVENTS.PRIVATE_CALL_ENDED, {
          sessionId,
          endedBy: user.id,
        });
      }

      // Notify caller
      socket.emit(SOCKET_EVENTS.PRIVATE_CALL_ENDED, {
        sessionId,
        endedBy: user.id,
      });

      // Resume streamer's stream for viewers if room still exists
      const streamRoom = memoryStore.getStreamRoom(session.streamerId);
      if (streamRoom) {
        io.to(session.streamerId).emit(SOCKET_EVENTS.STREAM_RESUMED_FROM_PRIVATE, {
          streamerId: session.streamerId,
        });
      }

      broadcastActiveStreams(io);
      broadcastOnlineUsers(io);

      if (ack) ack({ success: true });
    } catch (err) {
      Logger.error('PrivateCall', 'Error ending private call', err);
      if (ack) ack({ success: false, error: 'Failed to end private call' });
    }
  });
}
