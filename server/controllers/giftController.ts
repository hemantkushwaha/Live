import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { giftService } from '../services/giftService';
import { ApiResponse, TipGiftRecord } from '../../shared/types';
import { getIO } from '../socket/socketHandler';
import { SOCKET_EVENTS } from '../../shared/events';

export class GiftController {
  private static instance: GiftController;

  public static getInstance(): GiftController {
    if (!GiftController.instance) {
      GiftController.instance = new GiftController();
    }
    return GiftController.instance;
  }

  /**
   * POST /api/v1/gifts/send
   */
  public async sendGift(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { streamId, receiverId, giftId, giftType, message } = req.body || {};
      const targetGiftId = giftId || giftType;

      if (!streamId || !receiverId || !targetGiftId) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameters',
          error: 'streamId, receiverId, and giftId are required',
        } as ApiResponse);
        return;
      }

      const result = giftService.sendGift(
        req.user,
        streamId,
        receiverId,
        targetGiftId,
        message
      );

      // Emit socket real-time events
      try {
        const io = getIO();
        if (io) {
          const payload = {
            record: result.record,
            gift: result.record,
            senderWallet: result.senderWallet,
            receiverWallet: result.receiverWallet,
          };

          // Broadcast to stream room and receiver
          io.to(`stream:${streamId}`).emit(SOCKET_EVENTS.GIFT_SENT, payload);
          io.to(`stream:${streamId}`).emit('gift:received', payload);
          io.to(`user:${receiverId}`).emit('gift:received', payload);

          // Wallet balance updates
          io.to(`user:${req.user.id}`).emit(SOCKET_EVENTS.WALLET_UPDATED, result.senderWallet);
          io.to(`user:${req.user.id}`).emit('wallet:updated', result.senderWallet);
          io.to(`user:${receiverId}`).emit(SOCKET_EVENTS.WALLET_UPDATED, result.receiverWallet);
          io.to(`user:${receiverId}`).emit('wallet:updated', result.receiverWallet);
        }
      } catch (e) {
        // Socket emit failure shouldn't fail HTTP response
      }

      res.status(200).json({
        success: true,
        message: `Successfully sent ${result.record.giftName || 'gift'}`,
        data: result,
      } as ApiResponse<typeof result>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send gift',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * POST /api/v1/tips/send
   */
  public async sendTip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { streamId, receiverId, amount, message } = req.body || {};
      const numAmount = Number(amount);

      if (!streamId || !receiverId || isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid tip parameters',
          error: 'streamId, receiverId, and positive amount are required',
        } as ApiResponse);
        return;
      }

      const result = giftService.sendTip(
        req.user,
        streamId,
        receiverId,
        numAmount,
        message
      );

      // Emit socket real-time events
      try {
        const io = getIO();
        if (io) {
          const payload = {
            record: result.record,
            tip: result.record,
            senderWallet: result.senderWallet,
            receiverWallet: result.receiverWallet,
          };

          io.to(`stream:${streamId}`).emit(SOCKET_EVENTS.TIP_SENT, payload);
          io.to(`stream:${streamId}`).emit('tip:received', payload);
          io.to(`user:${receiverId}`).emit('tip:received', payload);

          io.to(`user:${req.user.id}`).emit(SOCKET_EVENTS.WALLET_UPDATED, result.senderWallet);
          io.to(`user:${req.user.id}`).emit('wallet:updated', result.senderWallet);
          io.to(`user:${receiverId}`).emit(SOCKET_EVENTS.WALLET_UPDATED, result.receiverWallet);
          io.to(`user:${receiverId}`).emit('wallet:updated', result.receiverWallet);
        }
      } catch (e) {
        // Socket emit error ignored
      }

      res.status(200).json({
        success: true,
        message: `Successfully tipped ${numAmount} Coins`,
        data: result,
      } as ApiResponse<typeof result>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send tip',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * GET /api/v1/gifts/history
   */
  public async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const streamId = req.query.streamId as string | undefined;
      const userId = req.user?.id;

      const history = giftService.getHistory(streamId, userId);
      res.status(200).json({
        success: true,
        message: 'Gift and tip history retrieved successfully',
        data: history,
      } as ApiResponse<TipGiftRecord[]>);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve gift history',
        error: error.message,
      } as ApiResponse);
    }
  }
}

export const giftController = GiftController.getInstance();
