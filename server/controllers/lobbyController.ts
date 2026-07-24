import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { lobbyService } from '../services/lobbyService';
import { createSuccessResponse } from '../../shared/helpers/response';

export class LobbyController {
  /**
   * GET /api/v1/lobby
   * Returns current user, online users, and active streams
   */
  public static getLobbyData(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const lobbyState = lobbyService.getLobbyState(req.user);
      res.status(200).json(createSuccessResponse(lobbyState, 'Lobby data retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}
