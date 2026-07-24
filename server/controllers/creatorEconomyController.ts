import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { creatorEconomyService, AVAILABLE_GIFTS } from '../services/creatorEconomyService';
import { Logger } from '../utils/logger';

export class CreatorEconomyController {
  /**
   * GET /api/v1/economy/settings/:creatorId
   */
  public async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const creatorId = req.params.creatorId || req.user?.id;
      if (!creatorId) {
        res.status(400).json({ success: false, message: 'Creator ID is required' });
        return;
      }

      const settings = creatorEconomyService.getCreatorSettings(creatorId);
      res.status(200).json({ success: true, data: settings });
    } catch (err: any) {
      Logger.error('CreatorEconomyController', 'Error in getSettings', err);
      res.status(500).json({ success: false, message: 'Failed to fetch creator settings' });
    }
  }

  /**
   * PUT /api/v1/economy/settings
   */
  public async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { privateCallPrice, minTipRequirement, maxCallDuration, autoReject, offlineMode } = req.body || {};

      const updated = creatorEconomyService.updateCreatorSettings(req.user.id, {
        privateCallPrice: typeof privateCallPrice === 'number' ? privateCallPrice : undefined,
        minTipRequirement: typeof minTipRequirement === 'number' ? minTipRequirement : undefined,
        maxCallDuration: typeof maxCallDuration === 'number' ? maxCallDuration : undefined,
        autoReject: typeof autoReject === 'boolean' ? autoReject : undefined,
        offlineMode: typeof offlineMode === 'boolean' ? offlineMode : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Creator settings updated successfully',
        data: updated,
      });
    } catch (err: any) {
      Logger.error('CreatorEconomyController', 'Error in updateSettings', err);
      res.status(400).json({ success: false, message: err.message || 'Failed to update settings' });
    }
  }

  /**
   * GET /api/v1/economy/wallet
   */
  public async getWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const wallet = creatorEconomyService.getUserWallet(req.user.id);
      res.status(200).json({ success: true, data: wallet });
    } catch (err: any) {
      Logger.error('CreatorEconomyController', 'Error in getWallet', err);
      res.status(500).json({ success: false, message: 'Failed to fetch wallet' });
    }
  }

  /**
   * POST /api/v1/economy/wallet/topup
   */
  public async topUpWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { amount } = req.body || {};
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ success: false, message: 'Valid top-up amount is required' });
        return;
      }

      const wallet = creatorEconomyService.topUpWallet(req.user.id, numAmount);
      res.status(200).json({
        success: true,
        message: `Successfully topped up $${numAmount.toFixed(2)}`,
        data: wallet,
      });
    } catch (err: any) {
      Logger.error('CreatorEconomyController', 'Error in topUpWallet', err);
      res.status(400).json({ success: false, message: err.message || 'Failed to top up wallet' });
    }
  }

  /**
   * POST /api/v1/economy/tip
   */
  public async sendTip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { streamId, receiverId, amount, message } = req.body || {};
      const numAmount = parseFloat(amount);

      if (!streamId || !receiverId || isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ success: false, message: 'streamId, receiverId and valid amount are required' });
        return;
      }

      const record = creatorEconomyService.sendTip(req.user, streamId, receiverId, numAmount, message);
      res.status(201).json({
        success: true,
        message: `Tip of $${numAmount.toFixed(2)} sent!`,
        data: record,
      });
    } catch (err: any) {
      Logger.warn('CreatorEconomyController', `Tip failed: ${err.message}`);
      res.status(400).json({ success: false, message: err.message || 'Failed to send tip' });
    }
  }

  /**
   * POST /api/v1/economy/gift
   */
  public async sendGift(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { streamId, receiverId, giftId, message } = req.body || {};
      if (!streamId || !receiverId || !giftId) {
        res.status(400).json({ success: false, message: 'streamId, receiverId, and giftId are required' });
        return;
      }

      const record = creatorEconomyService.sendGift(req.user, streamId, receiverId, giftId, message);
      res.status(201).json({
        success: true,
        message: `Gift ${record.giftName} sent!`,
        data: record,
      });
    } catch (err: any) {
      Logger.warn('CreatorEconomyController', `Gift failed: ${err.message}`);
      res.status(400).json({ success: false, message: err.message || 'Failed to send gift' });
    }
  }

  /**
   * GET /api/v1/economy/gifts/available
   */
  public async getAvailableGifts(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({ success: true, data: AVAILABLE_GIFTS });
  }

  /**
   * GET /api/v1/economy/stream/:streamId/tips-gifts
   */
  public async getStreamTipsGifts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { streamId } = req.params;
      const records = creatorEconomyService.getStreamTipsAndGifts(streamId);
      res.status(200).json({ success: true, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch tips and gifts' });
    }
  }

  /**
   * GET /api/v1/economy/stream/:streamId/check-requirements
   */
  public async checkRequirements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { streamId } = req.params;
      const creatorId = req.query.creatorId as string;

      if (!creatorId) {
        res.status(400).json({ success: false, message: 'creatorId is required' });
        return;
      }

      const validation = creatorEconomyService.validatePrivateRequestRequirements(creatorId, streamId, req.user.id);
      res.status(200).json({ success: true, data: validation });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to check requirements' });
    }
  }
}

export const creatorEconomyController = new CreatorEconomyController();
