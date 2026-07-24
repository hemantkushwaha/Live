import {
  AnalyticsSummary,
  AnalyticsTimeframe,
  EarningsChartPoint,
  RevenueCardsData,
  TopSupporter,
  TipGiftRecord,
  CallSessionSummary,
} from '../../shared/types';
import { giftService } from './giftService';
import { privateSessionManager } from './privateSessionManager';
import { walletService } from './walletService';
import { streamService } from './streamService';
import { Logger } from '../utils/logger';

export class CreatorAnalyticsService {
  private static instance: CreatorAnalyticsService;

  public static getInstance(): CreatorAnalyticsService {
    if (!CreatorAnalyticsService.instance) {
      CreatorAnalyticsService.instance = new CreatorAnalyticsService();
    }
    return CreatorAnalyticsService.instance;
  }

  /**
   * Calculate timestamp threshold for timeframe filter
   */
  private getStartTimeFromFilter(filter: AnalyticsTimeframe): number {
    const now = Date.now();
    switch (filter) {
      case 'today': {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return startOfDay.getTime();
      }
      case '7d':
        return now - 7 * 24 * 60 * 60 * 1000;
      case '30d':
        return now - 30 * 24 * 60 * 60 * 1000;
      case 'all':
      default:
        return 0;
    }
  }

  /**
   * Revenue cards metrics across today, 7d, 30d, lifetime, and wallet balance
   */
  public getRevenueCards(creatorId: string): RevenueCardsData {
    const wallet = walletService.getWallet(creatorId);
    const gifts = giftService.getHistory().filter((g) => g.receiverId === creatorId);
    const sessions = privateSessionManager
      .getAllSummaries()
      .filter((s) => s.creatorId === creatorId);

    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();
    const weekMs = now - 7 * 24 * 60 * 60 * 1000;
    const monthMs = now - 30 * 24 * 60 * 60 * 1000;

    let today = 0;
    let weekly = 0;
    let monthly = 0;
    let lifetime = 0;

    // Sum gift and tip earnings
    for (const g of gifts) {
      const amt = g.amount || 0;
      lifetime += amt;
      if (g.createdAt >= monthMs) monthly += amt;
      if (g.createdAt >= weekMs) weekly += amt;
      if (g.createdAt >= todayMs) today += amt;
    }

    // Sum private call earnings
    for (const s of sessions) {
      const amt = s.creatorEarned || s.coinsPaid || 0;
      const time = s.endedAt || s.startedAt || now;
      lifetime += amt;
      if (time >= monthMs) monthly += amt;
      if (time >= weekMs) weekly += amt;
      if (time >= todayMs) today += amt;
    }

    return {
      today,
      weekly,
      monthly,
      lifetime,
      walletBalance: wallet.balance,
    };
  }

  /**
   * Analytics summary for selected timeframe
   */
  public getAnalyticsSummary(creatorId: string, timeframe: AnalyticsTimeframe): AnalyticsSummary {
    const startTime = this.getStartTimeFromFilter(timeframe);

    const giftRecords = giftService
      .getHistory()
      .filter((g) => g.receiverId === creatorId && g.createdAt >= startTime);

    const privateSessions = privateSessionManager
      .getAllSummaries()
      .filter((s) => s.creatorId === creatorId && (s.endedAt || s.startedAt) >= startTime);

    const activeStream = streamService.getStreamByHostId(creatorId);

    let totalGiftsCoins = 0;
    let totalGiftsCount = 0;
    let totalTipsCoins = 0;
    let totalTipsCount = 0;

    for (const g of giftRecords) {
      if (g.type === 'gift') {
        totalGiftsCoins += g.amount;
        totalGiftsCount += 1;
      } else {
        totalTipsCoins += g.amount;
        totalTipsCount += 1;
      }
    }

    let privateCallCoins = 0;
    let privateCallCount = privateSessions.length;
    let totalPrivateSeconds = 0;

    for (const s of privateSessions) {
      privateCallCoins += s.creatorEarned || s.coinsPaid || 0;
      totalPrivateSeconds += s.durationSeconds || 0;
    }

    const privateCallMinutes = Math.round((totalPrivateSeconds / 60) * 10) / 10;
    const totalSessions = privateCallCount + (activeStream ? 1 : 0);

    const avgSessionSeconds =
      totalSessions > 0 ? totalPrivateSeconds / Math.max(1, privateCallCount) : 0;
    const avgSessionTimeMinutes = Math.round((avgSessionSeconds / 60) * 10) / 10;

    const peakViewers = activeStream ? activeStream.peakViewers || activeStream.viewers.length || 0 : 0;

    return {
      totalGiftsCoins,
      totalGiftsCount,
      totalTipsCoins,
      totalTipsCount,
      privateCallCoins,
      privateCallCount,
      privateCallMinutes,
      totalSessions,
      avgSessionTimeMinutes,
      peakViewers,
    };
  }

  /**
   * Top 10 Supporters for creator
   */
  public getTopSupporters(creatorId: string, timeframe: AnalyticsTimeframe): TopSupporter[] {
    const startTime = this.getStartTimeFromFilter(timeframe);

    const gifts = giftService
      .getHistory()
      .filter((g) => g.receiverId === creatorId && g.createdAt >= startTime);

    const sessions = privateSessionManager
      .getAllSummaries()
      .filter((s) => s.creatorId === creatorId && (s.endedAt || s.startedAt) >= startTime);

    const map = new Map<string, TopSupporter>();

    for (const g of gifts) {
      const vId = g.senderId;
      const vName = g.senderName || g.senderEmail?.split('@')[0] || 'Viewer';
      const existing = map.get(vId) || {
        viewerId: vId,
        viewerName: vName,
        totalCoinsSpent: 0,
        giftsSentCount: 0,
        privateCallsCount: 0,
        lastActive: g.createdAt,
      };

      existing.totalCoinsSpent += g.amount;
      existing.giftsSentCount += 1;
      if (g.createdAt > existing.lastActive) existing.lastActive = g.createdAt;
      map.set(vId, existing);
    }

    for (const s of sessions) {
      const vId = s.viewerId;
      const vName = s.viewerName || 'Viewer';
      const existing = map.get(vId) || {
        viewerId: vId,
        viewerName: vName,
        totalCoinsSpent: 0,
        giftsSentCount: 0,
        privateCallsCount: 0,
        lastActive: s.endedAt || s.startedAt,
      };

      existing.totalCoinsSpent += s.coinsPaid || s.creatorEarned || 0;
      existing.privateCallsCount += 1;
      const sTime = s.endedAt || s.startedAt;
      if (sTime > existing.lastActive) existing.lastActive = sTime;
      map.set(vId, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => b.totalCoinsSpent - a.totalCoinsSpent)
      .slice(0, 10);
  }

  /**
   * Chart data points aggregated by day/time for line or bar charts
   */
  public getEarningsChartData(creatorId: string, timeframe: AnalyticsTimeframe): EarningsChartPoint[] {
    const now = new Date();
    const points: EarningsChartPoint[] = [];

    // Determine number of buckets and label interval
    const days = timeframe === 'today' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 14;

    const gifts = giftService.getHistory().filter((g) => g.receiverId === creatorId);
    const sessions = privateSessionManager
      .getAllSummaries()
      .filter((s) => s.creatorId === creatorId);

    if (days === 1) {
      // 24 hours for Today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      for (let hour = 0; hour < 24; hour += 2) {
        const hStart = new Date(startOfDay.getTime() + hour * 3600 * 1000);
        const hEnd = new Date(startOfDay.getTime() + (hour + 2) * 3600 * 1000);

        let giftSum = 0;
        let tipSum = 0;
        let privateSum = 0;

        for (const g of gifts) {
          if (g.createdAt >= hStart.getTime() && g.createdAt < hEnd.getTime()) {
            if (g.type === 'gift') giftSum += g.amount;
            else tipSum += g.amount;
          }
        }

        for (const s of sessions) {
          const t = s.endedAt || s.startedAt;
          if (t >= hStart.getTime() && t < hEnd.getTime()) {
            privateSum += s.creatorEarned || s.coinsPaid || 0;
          }
        }

        points.push({
          timestamp: hStart.getTime(),
          date: hStart.toISOString(),
          label: `${hour.toString().padStart(2, '0')}:00`,
          gifts: giftSum,
          tips: tipSum,
          privateCalls: privateSum,
          total: giftSum + tipSum + privateSum,
        });
      }
    } else {
      // Daily intervals for 7d, 30d, all
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();

        let giftSum = 0;
        let tipSum = 0;
        let privateSum = 0;

        for (const g of gifts) {
          if (g.createdAt >= dStart && g.createdAt < dEnd) {
            if (g.type === 'gift') giftSum += g.amount;
            else tipSum += g.amount;
          }
        }

        for (const s of sessions) {
          const t = s.endedAt || s.startedAt;
          if (t >= dStart && t < dEnd) {
            privateSum += s.creatorEarned || s.coinsPaid || 0;
          }
        }

        const dateLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

        points.push({
          timestamp: dStart,
          date: d.toISOString().split('T')[0],
          label: dateLabel,
          gifts: giftSum,
          tips: tipSum,
          privateCalls: privateSum,
          total: giftSum + tipSum + privateSum,
        });
      }
    }

    return points;
  }
}

export const creatorAnalyticsService = CreatorAnalyticsService.getInstance();
