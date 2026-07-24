import { Server as SocketIOServer, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../../shared/events';
import { giftService } from '../services/giftService';
import { sessionStore } from '../store/sessionStore';
import { presenceService } from '../services/presenceService';
import { Logger } from '../utils/logger';

export function registerCreatorEconomySocketHandlers(io: SocketIOServer, socket: Socket) {
  const handleTipSend = (data: { token?: string; streamId: string; receiverId: string; amount: number; message?: string }) => {
    try {
      const token = data?.token || (socket.handshake.auth?.token as string);
      if (!token) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required to send tip' });
        return;
      }

      const session = sessionStore.getSession(token);
      if (!session || !session.user) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid session token' });
        return;
      }

      const { streamId, receiverId, amount, message } = data || {};
      if (!streamId || !receiverId || !amount) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'streamId, receiverId, and amount are required' });
        return;
      }

      try {
        const result = giftService.sendTip(session.user, streamId, receiverId, Number(amount), message);
        const streamRoom = `stream:${streamId}`;

        const payload = {
          record: result.record,
          tip: result.record,
          senderWallet: result.senderWallet,
          receiverWallet: result.receiverWallet,
        };

        // Broadcast tip event to stream room and receiver
        io.to(streamRoom).emit(SOCKET_EVENTS.TIP_SENT, payload);
        io.to(streamRoom).emit('tip:received', payload);
        io.to(`user:${receiverId}`).emit('tip:received', payload);

        // Send wallet updates to sender and receiver
        socket.emit(SOCKET_EVENTS.WALLET_UPDATED, result.senderWallet);
        socket.emit('wallet:updated', result.senderWallet);

        const onlineUsers = presenceService.getOnlineUsers();
        const receiverPresence = onlineUsers.find((u) => u.userId === receiverId);
        if (receiverPresence?.socketId) {
          io.to(receiverPresence.socketId).emit(SOCKET_EVENTS.WALLET_UPDATED, result.receiverWallet);
          io.to(receiverPresence.socketId).emit('wallet:updated', result.receiverWallet);
        }

        Logger.info('CreatorEconomySocket', `Tip of ${amount} Coins broadcasted to ${streamRoom}`);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to send tip' });
      }
    } catch (err: any) {
      Logger.error('CreatorEconomySocket', 'Error handling tip_sent socket event', err);
    }
  };

  const handleGiftSend = (data: { token?: string; streamId: string; receiverId: string; giftId?: string; giftType?: string; message?: string }) => {
    try {
      const token = data?.token || (socket.handshake.auth?.token as string);
      if (!token) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required to send gift' });
        return;
      }

      const session = sessionStore.getSession(token);
      if (!session || !session.user) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid session token' });
        return;
      }

      const { streamId, receiverId, giftId, giftType, message } = data || {};
      const targetGiftId = giftId || giftType;

      if (!streamId || !receiverId || !targetGiftId) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'streamId, receiverId, and giftId are required' });
        return;
      }

      try {
        const result = giftService.sendGift(session.user, streamId, receiverId, targetGiftId, message);
        const streamRoom = `stream:${streamId}`;

        const payload = {
          record: result.record,
          gift: result.record,
          senderWallet: result.senderWallet,
          receiverWallet: result.receiverWallet,
        };

        // Broadcast gift event to stream room and receiver
        io.to(streamRoom).emit(SOCKET_EVENTS.GIFT_SENT, payload);
        io.to(streamRoom).emit('gift:received', payload);
        io.to(`user:${receiverId}`).emit('gift:received', payload);

        // Send wallet updates to sender and receiver
        socket.emit(SOCKET_EVENTS.WALLET_UPDATED, result.senderWallet);
        socket.emit('wallet:updated', result.senderWallet);

        const onlineUsers = presenceService.getOnlineUsers();
        const receiverPresence = onlineUsers.find((u) => u.userId === receiverId);
        if (receiverPresence?.socketId) {
          io.to(receiverPresence.socketId).emit(SOCKET_EVENTS.WALLET_UPDATED, result.receiverWallet);
          io.to(receiverPresence.socketId).emit('wallet:updated', result.receiverWallet);
        }

        Logger.info('CreatorEconomySocket', `Gift ${result.record.giftName} broadcasted to ${streamRoom}`);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to send gift' });
      }
    } catch (err: any) {
      Logger.error('CreatorEconomySocket', 'Error handling gift_sent socket event', err);
    }
  };

  /**
   * Register listeners for both legacy/custom and standard events
   */
  socket.on(SOCKET_EVENTS.TIP_SENT, handleTipSend);
  socket.on('tip:send', handleTipSend);

  socket.on(SOCKET_EVENTS.GIFT_SENT, handleGiftSend);
  socket.on('gift:send', handleGiftSend);
}
