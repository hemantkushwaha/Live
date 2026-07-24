import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { creatorDashboardService } from '../services/creatorDashboardService';
import { AnalyticsTimeframe } from '../../shared/types';
import { Logger } from '../utils/logger';

export class CreatorDashboardController {
  /**
   * GET /api/v1/creator/dashboard
   */
  public async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const creatorId = req.user?.id;
      if (!creatorId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized: User authentication required',
        });
        return;
      }

      const timeframeParam = (req.query.timeframe || req.query.period || 'all') as string;
      const validTimeframes: AnalyticsTimeframe[] = ['today', '7d', '30d', 'all'];
      const timeframe: AnalyticsTimeframe = validTimeframes.includes(
        timeframeParam.toLowerCase() as AnalyticsTimeframe
      )
        ? (timeframeParam.toLowerCase() as AnalyticsTimeframe)
        : 'all';

      const dashboardData = creatorDashboardService.getDashboardData(creatorId, timeframe);

      res.status(200).json({
        success: true,
        message: 'Creator dashboard retrieved successfully',
        data: dashboardData,
      });
    } catch (err: any) {
      Logger.error('CreatorDashboardController', 'Error in getDashboard', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Internal server error fetching creator dashboard',
      });
    }
  }

  /**
   * GET /api/v1/creator/analytics
   */
  public async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const creatorId = req.user?.id;
      if (!creatorId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized: User authentication required',
        });
        return;
      }

      const timeframeParam = (req.query.timeframe || req.query.period || '7d') as string;
      const validTimeframes: AnalyticsTimeframe[] = ['today', '7d', '30d', 'all'];
      const timeframe: AnalyticsTimeframe = validTimeframes.includes(
        timeframeParam.toLowerCase() as AnalyticsTimeframe
      )
        ? (timeframeParam.toLowerCase() as AnalyticsTimeframe)
        : '7d';

      const analyticsData = creatorDashboardService.getAnalyticsData(creatorId, timeframe);

      res.status(200).json({
        success: true,
        message: 'Creator analytics retrieved successfully',
        data: analyticsData,
      });
    } catch (err: any) {
      Logger.error('CreatorDashboardController', 'Error in getAnalytics', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Internal server error fetching creator analytics',
      });
    }
  }
}

export const creatorDashboardController = new CreatorDashboardController();
