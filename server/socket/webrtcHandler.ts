import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket } from './socketHandler';
import { memoryStore } from '../store/memoryStore';
import { SOCKET_EVENTS } from '../../shared/events';
import { WebRTCSignalPayload } from '../../shared/types';
import { Logger } from '../utils/logger';

export function registerWebRtcHandlers(io: SocketIOServer, socket: AuthenticatedSocket) {
  const user = socket.user;
  if (!user) return;

  // Relay WebRTC Offer
  socket.on(SOCKET_EVENTS.WEBRTC_OFFER, (payload: WebRTCSignalPayload) => {
    try {
      const targetUser = memoryStore.getUser(payload.targetUserId);
      if (targetUser?.socketId) {
        Logger.debug('WebRTC', `Relaying offer from ${user.id} to ${payload.targetUserId} (${payload.context})`);
        io.to(targetUser.socketId).emit(SOCKET_EVENTS.WEBRTC_OFFER, {
          ...payload,
          senderUserId: user.id,
        });
      } else {
        Logger.warn('WebRTC', `Target user ${payload.targetUserId} not online for offer`);
      }
    } catch (err) {
      Logger.error('WebRTC', 'Error handling WebRTC offer', err);
    }
  });

  // Relay WebRTC Answer
  socket.on(SOCKET_EVENTS.WEBRTC_ANSWER, (payload: WebRTCSignalPayload) => {
    try {
      const targetUser = memoryStore.getUser(payload.targetUserId);
      if (targetUser?.socketId) {
        Logger.debug('WebRTC', `Relaying answer from ${user.id} to ${payload.targetUserId} (${payload.context})`);
        io.to(targetUser.socketId).emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
          ...payload,
          senderUserId: user.id,
        });
      } else {
        Logger.warn('WebRTC', `Target user ${payload.targetUserId} not online for answer`);
      }
    } catch (err) {
      Logger.error('WebRTC', 'Error handling WebRTC answer', err);
    }
  });

  // Relay WebRTC ICE Candidate
  socket.on(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, (payload: WebRTCSignalPayload) => {
    try {
      const targetUser = memoryStore.getUser(payload.targetUserId);
      if (targetUser?.socketId) {
        io.to(targetUser.socketId).emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, {
          ...payload,
          senderUserId: user.id,
        });
      }
    } catch (err) {
      Logger.error('WebRTC', 'Error handling ICE candidate', err);
    }
  });
}
