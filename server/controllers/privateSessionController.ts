import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { privateSessionManager } from '../services/privateSessionManager';
import { Logger } from '../utils/logger';

export class PrivateSessionController {
  /**
   * GET /api/v1/private/session/:id
   * Get active or completed private session details
   */
  public async getSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sessionId = req.params.id;
      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required',
        });
        return;
      }

      const session = privateSessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          message: `Private session '${sessionId}' not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (err: any) {
      Logger.error('PrivateSessionController', 'Error in getSession', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching session details',
      });
    }
  }

  /**
   * GET /api/v1/private/session/:id/summary
   * Get completed session summary
   */
  public async getSessionSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sessionId = req.params.id;
      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required',
        });
        return;
      }

      const summary = privateSessionManager.getSummary(sessionId);
      if (!summary) {
        // Fall back to checking if active/completed session exists and building summary dynamically
        const session = privateSessionManager.getSession(sessionId);
        if (session && (session.status === 'completed' || session.status === 'ended')) {
          const fallbackSummary = {
            sessionId: session.id,
            requestId: session.requestId,
            streamId: session.streamId,
            creatorId: session.creatorId,
            creatorName: session.creatorName || 'Creator',
            viewerId: session.viewerId,
            viewerName: session.viewerName || 'Viewer',
            durationSeconds: session.elapsedTimeSeconds || 0,
            coinsPaid: session.coinsPaid || 0,
            creatorEarned: session.creatorEarned || 0,
            ratePerMinute: session.ratePerMinute || 50,
            startedAt: session.startedAt,
            endedAt: session.endedAt || Date.now(),
            endReason: 'completed' as const,
          };
          res.status(200).json({
            success: true,
            data: fallbackSummary,
          });
          return;
        }

        res.status(404).json({
          success: false,
          message: `Summary for session '${sessionId}' not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err: any) {
      Logger.error('PrivateSessionController', 'Error in getSessionSummary', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching session summary',
      });
    }
  }
}

export const privateSessionController = new PrivateSessionController();
