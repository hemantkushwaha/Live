import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { discoveryService } from '../services/discoveryService';
import { Logger } from '../utils/logger';

export class DiscoveryController {
  /**
   * GET /api/v1/discovery
   * Fetch discovery sections (Trending, Online, Recently Live, Newest)
   */
  public async getDiscovery(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUserId = req.user?.id;
      const payload = discoveryService.getDiscoveryPayload(currentUserId);

      res.status(200).json({
        success: true,
        message: 'Discovery data retrieved successfully',
        data: payload,
      });
    } catch (err: any) {
      Logger.error('DiscoveryController', 'Error in getDiscovery', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Error fetching discovery payload',
      });
    }
  }
}

export const discoveryController = new DiscoveryController();
