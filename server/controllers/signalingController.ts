import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { signalingService } from '../services/signalingService';
import { Logger } from '../utils/logger';

export class SignalingController {
  /**
   * GET /api/v1/signaling/sessions/:streamId
   * Get active WebRTC signaling sessions for a stream
   */
  public async getSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { streamId } = req.params;
      if (!streamId) {
        res.status(400).json({
          success: false,
          message: 'Stream ID parameter is required.',
        });
        return;
      }

      const sessions = signalingService.getStreamSessions(streamId);
      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (err: any) {
      Logger.error('SignalingController', 'Error in getSessions', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching signaling sessions.',
      });
    }
  }
}

export const signalingController = new SignalingController();
