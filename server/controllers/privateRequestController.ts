import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { privateRequestService } from '../services/privateRequestService';
import { privateCallSettingsService } from '../services/privateCallSettingsService';
import { Logger } from '../utils/logger';

export class PrivateRequestController {
  /**
   * GET /api/v1/private/settings
   * Retrieve creator private call settings
   */
  public async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const creatorId = (req.query.creatorId as string) || req.user?.id;
      if (!creatorId) {
        res.status(400).json({
          success: false,
          message: 'Creator ID is required',
        });
        return;
      }

      const settings = privateCallSettingsService.getSettings(creatorId);
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err: any) {
      Logger.error('PrivateRequestController', 'Error in getSettings', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch private call settings',
      });
    }
  }

  /**
   * PUT /api/v1/private/settings
   * Update authenticated creator's private call settings
   */
  public async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to update settings',
        });
        return;
      }

      const { enabled, minCoins, pricePerMinute, maxDuration, busyMode } = req.body || {};
      const updated = privateCallSettingsService.updateSettings(req.user.id, {
        enabled: typeof enabled === 'boolean' ? enabled : undefined,
        minCoins: typeof minCoins === 'number' ? minCoins : undefined,
        pricePerMinute: typeof pricePerMinute === 'number' ? pricePerMinute : undefined,
        maxDuration: typeof maxDuration === 'number' ? maxDuration : undefined,
        busyMode: typeof busyMode === 'boolean' ? busyMode : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Private call settings updated successfully',
        data: updated,
      });
    } catch (err: any) {
      Logger.error('PrivateRequestController', 'Error in updateSettings', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to update private call settings',
      });
    }
  }

  /**
   * POST /api/v1/private/request
   * Create a new private call request
   */
  public async createRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to request a private call.',
        });
        return;
      }

      const { streamId, requestedDuration, duration } = req.body || {};
      if (!streamId) {
        res.status(400).json({
          success: false,
          message: 'streamId is required',
        });
        return;
      }

      const targetDuration = Number(requestedDuration || duration || 5);

      try {
        const request = privateRequestService.createRequest(req.user, streamId, targetDuration);
        res.status(201).json({
          success: true,
          message: 'Private call request sent successfully',
          data: request,
        });
      } catch (err: any) {
        Logger.warn('PrivateRequestController', `Failed to create request: ${err.message}`);
        res.status(400).json({
          success: false,
          message: err.message || 'Failed to create request',
        });
      }
    } catch (err: any) {
      Logger.error('PrivateRequestController', 'Error in createRequest', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating private call request.',
      });
    }
  }

  /**
   * DELETE /api/v1/private/request/:id
   * Cancel an active request
   */
  public async cancelRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to cancel request.',
        });
        return;
      }

      const requestId = req.params.id;
      if (!requestId) {
        res.status(400).json({
          success: false,
          message: 'Request ID is required',
        });
        return;
      }

      try {
        const request = privateRequestService.cancelRequest(requestId, req.user.id);
        res.status(200).json({
          success: true,
          message: 'Private call request cancelled successfully',
          data: request,
        });
      } catch (err: any) {
        Logger.warn('PrivateRequestController', `Failed to cancel request: ${err.message}`);
        res.status(400).json({
          success: false,
          message: err.message || 'Failed to cancel request',
        });
      }
    } catch (err: any) {
      Logger.error('PrivateRequestController', 'Error in cancelRequest', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while cancelling request.',
      });
    }
  }

  /**
   * POST /api/v1/private/request/:id/accept
   * Accept a pending request (Creator)
   */
  public async acceptRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to accept request.',
        });
        return;
      }

      const requestId = req.params.id;
      if (!requestId) {
        res.status(400).json({
          success: false,
          message: 'Request ID is required',
        });
        return;
      }

      try {
        const request = privateRequestService.acceptRequest(requestId, req.user.id);
        res.status(200).json({
          success: true,
          message: 'Private call request accepted successfully',
          data: request,
        });
      } catch (err: any) {
        Logger.warn('PrivateRequestController', `Failed to accept request: ${err.message}`);
        res.status(400).json({
          success: false,
          message: err.message || 'Failed to accept request',
        });
      }
    } catch (err: any) {
      Logger.error('PrivateRequestController', 'Error in acceptRequest', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while accepting request.',
      });
    }
  }

  /**
   * POST /api/v1/private/request/:id/reject
   * Reject a pending request (Creator)
   */
  public async rejectRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to reject request.',
        });
        return;
      }

      const requestId = req.params.id;
      if (!requestId) {
        res.status(400).json({
          success: false,
          message: 'Request ID is required',
        });
        return;
      }

      try {
        const request = privateRequestService.rejectRequest(requestId, req.user.id);
        res.status(200).json({
          success: true,
          message: 'Private call request rejected successfully',
          data: request,
        });
      } catch (err: any) {
        Logger.warn('PrivateRequestController', `Failed to reject request: ${err.message}`);
        res.status(400).json({
          success: false,
          message: err.message || 'Failed to reject request',
        });
      }
    } catch (err: any) {
      Logger.error('PrivateRequestController', 'Error in rejectRequest', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while rejecting request.',
      });
    }
  }

  /**
   * GET /api/v1/private/requests
   * Fetch active requests for a stream or user
   */
  public async getRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to view requests.',
        });
        return;
      }

      const streamId = req.query.streamId as string;
      let requests;

      if (streamId) {
        requests = privateRequestService.getPendingRequestsForStream(streamId);
      } else {
        requests = privateRequestService.getAllRequests();
      }

      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (err: any) {
      Logger.error('PrivateRequestController', 'Error in getRequests', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching requests.',
      });
    }
  }
}

export const privateRequestController = new PrivateRequestController();
