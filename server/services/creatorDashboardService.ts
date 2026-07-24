import {
  CreatorAnalyticsData,
  CreatorDashboardData,
  AnalyticsTimeframe,
} from '../../shared/types';
import { creatorAnalyticsService } from './creatorAnalyticsService';
import { walletService } from './walletService';
import { Logger } from '../utils/logger';

export class CreatorDashboardService {
  private static instance: CreatorDashboardService;

  public static getInstance(): CreatorDashboardService {
    if (!CreatorDashboardService.instance) {
      CreatorDashboardService.instance = new CreatorDashboardService();
    }
    return CreatorDashboardService.instance;
  }

  /**
   * Fetch complete Dashboard payload for Creator
   */
  public getDashboardData(
    creatorId: string,
    timeframe: AnalyticsTimeframe = 'all'
  ): CreatorDashboardData {
    const revenue = creatorAnalyticsService.getRevenueCards(creatorId);
    const summary = creatorAnalyticsService.getAnalyticsSummary(creatorId, timeframe);
    const recentTransactions = walletService.getHistory(creatorId).slice(0, 15);
    const topSupporters = creatorAnalyticsService.getTopSupporters(creatorId, timeframe);

    Logger.info('CreatorDashboardService', `Built dashboard data for creator ${creatorId} (${timeframe})`);

    return {
      revenue,
      summary,
      recentTransactions,
      topSupporters,
      timeframe,
    };
  }

  /**
   * Fetch Analytics payload (including chart time-series data) for Creator
   */
  public getAnalyticsData(
    creatorId: string,
    timeframe: AnalyticsTimeframe = '7d'
  ): CreatorAnalyticsData {
    const revenue = creatorAnalyticsService.getRevenueCards(creatorId);
    const summary = creatorAnalyticsService.getAnalyticsSummary(creatorId, timeframe);
    const chartData = creatorAnalyticsService.getEarningsChartData(creatorId, timeframe);
    const topSupporters = creatorAnalyticsService.getTopSupporters(creatorId, timeframe);

    Logger.info('CreatorDashboardService', `Built analytics data for creator ${creatorId} (${timeframe})`);

    return {
      timeframe,
      revenue,
      summary,
      chartData,
      topSupporters,
    };
  }
}

export const creatorDashboardService = CreatorDashboardService.getInstance();
