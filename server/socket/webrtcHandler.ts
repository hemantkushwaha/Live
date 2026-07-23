import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket } from './socketHandler';
import { memoryStore } from '../store/memoryStore';
import { SOCKET_EVENTS } from '../../shared/events';
import { WebRTCSignalPayload } from '../../shared/types';
import { Logger } from '../utils/logger';

export function registerWebRtcHandlers(io: SocketIOServer, socket: AuthenticatedSocket) {
  const user = socket.user;
  if (!user) return;

  const handleOffer = (payload: WebRTCSignalPayload) => {
    try {
      const targetUser = memoryStore.getUser(payload.targetUserId);
      if (targetUser?.socketId) {
        Logger.debug('WebRTC', `Relaying offer from ${user.id} to ${payload.targetUserId} (${payload.context})`);
        io.to(targetUser.socketId).emit(SOCKET_EVENTS.WEBRTC_OFFER, {
          ...payload,
          senderUserId: user.id,
        });
        io.to(targetUser.socketId).emit(SOCKET_EVENTS.SIGNAL_OFFER, {
          ...payload,
          senderUserId: user.id,
        });
      } else {
        Logger.warn('WebRTC', `Target user ${payload.targetUserId} not online for offer`);
      }
    } catch (err) {
      Logger.error('WebRTC', 'Error handling WebRTC offer', err);
    }
  };

  const handleAnswer = (payload: WebRTCSignalPayload) => {
    try {
      const targetUser = memoryStore.getUser(payload.targetUserId);
      if (targetUser?.socketId) {
        Logger.debug('WebRTC', `Relaying answer from ${user.id} to ${payload.targetUserId} (${payload.context})`);
        io.to(targetUser.socketId).emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
          ...payload,
          senderUserId: user.id,
        });
        io.to(targetUser.socketId).emit(SOCKET_EVENTS.SIGNAL_ANSWER, {
          ...payload,
          senderUserId: user.id,
        });
      } else {
        Logger.warn('WebRTC', `Target user ${payload.targetUserId} not online for answer`);
      }
    } catch (err) {
      Logger.error('WebRTC', 'Error handling WebRTC answer', err);
    }
  };

  const handleIceCandidate = (payload: WebRTCSignalPayload) => {
    try {
      const targetUser = memoryStore.getUser(payload.targetUserId);
      if (targetUser?.socketId) {
        io.to(targetUser.socketId).emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, {
          ...payload,
          senderUserId: user.id,
        });
        io.to(targetUser.socketId).emit(SOCKET_EVENTS.SIGNAL_ICE, {
          ...payload,
          senderUserId: user.id,
        });
      }
    } catch (err) {
      Logger.error('WebRTC', 'Error handling ICE candidate', err);
    }
  };

  // Relay WebRTC Offer
  socket.on(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer);
  socket.on(SOCKET_EVENTS.SIGNAL_OFFER, handleOffer);

  // Relay WebRTC Answer
  socket.on(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer);
  socket.on(SOCKET_EVENTS.SIGNAL_ANSWER, handleAnswer);

  // Relay WebRTC ICE Candidate
  socket.on(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, handleIceCandidate);
  socket.on(SOCKET_EVENTS.SIGNAL_ICE, handleIceCandidate);
}
