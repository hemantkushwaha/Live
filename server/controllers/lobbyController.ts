import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { lobbyService } from '../services/lobbyService';
import { performanceService } from '../services/PerformanceService';
import { createSuccessResponse } from '../../shared/helpers/response';

export class LobbyController {
  /**
   * GET /api/v1/lobby
   * Returns current user, online users, and active streams with caching optimization
   */
  public static getLobbyData(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const cacheKey = `lobby_data_${req.user?.id || 'anon'}`;
      const cached = performanceService.getCached(cacheKey);
      if (cached) {
        res.status(200).json(cached);
        return;
      }

      const lobbyState = lobbyService.getLobbyState(req.user);
      const responsePayload = createSuccessResponse(lobbyState, 'Lobby data retrieved successfully');
      
      // Cache response for 5 seconds for sub-30ms repeat latency
      performanceService.setCache(cacheKey, responsePayload, 5);
      res.status(200).json(responsePayload);
    } catch (error) {
      next(error);
    }
  }
}
