import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/healthService';
import { createSuccessResponse } from '../../shared/helpers/response';

export class HealthController {
  /**
   * Controller method to handle health check requests
   */
  public static getHealth(req: Request, res: Response, next: NextFunction): void {
    try {
      const healthData = HealthService.getHealthStatus();
      res.status(200).json(createSuccessResponse(healthData, 'Server running'));
    } catch (error) {
      next(error);
    }
  }
}
