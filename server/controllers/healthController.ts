import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/healthService';
import { createSuccessResponse } from '../../shared/helpers/response';

export class HealthController {
  /**
   * GET /api/v1/health
   */
  public static getHealth(req: Request, res: Response, next: NextFunction): void {
    try {
      const healthData = HealthService.getHealthStatus();
      const statusCode = healthData.status === 'unhealthy' ? 503 : 200;
      res.status(statusCode).json(createSuccessResponse(healthData, 'Health status check complete'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/ready (Readiness Probe)
   */
  public static getReadiness(req: Request, res: Response, next: NextFunction): void {
    try {
      const readyData = HealthService.getReadinessStatus();
      const statusCode = readyData.ready ? 200 : 503;
      res.status(statusCode).json(createSuccessResponse(readyData, readyData.ready ? 'Container ready' : 'Container not ready'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/live (Liveness Probe)
   */
  public static getLiveness(req: Request, res: Response, next: NextFunction): void {
    try {
      const livenessData = HealthService.getLivenessStatus();
      res.status(200).json(createSuccessResponse(livenessData, 'Container alive'));
    } catch (error) {
      next(error);
    }
  }
}
