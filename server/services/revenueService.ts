import { ledgerRepository } from '../repositories/ledgerRepository';
import { ledgerService } from './ledgerService';
import { CreatorEarnings, RevenueShareRule } from '../../shared/types';
import { Logger } from '../utils/logger';

export interface RevenueBreakdown {
  totalAmount: number;
  creatorShare: number;
  platformShare: number;
  creatorPercentage: number;
  platformPercentage: number;
}

export class RevenueService {
  private static instance: RevenueService;

  public static getInstance(): RevenueService {
    if (!RevenueService.instance) {
      RevenueService.instance = new RevenueService();
    }
    return RevenueService.instance;
  }

  /**
   * Calculate revenue share for a given category and amount
   */
  public calculateShare(
    category: 'gift' | 'tip' | 'private_call' | 'default',
    totalAmount: number
  ): RevenueBreakdown {
    const rule = ledgerRepository.getRevenueShareRule(category);
    const creatorShare = Math.floor((totalAmount * rule.creatorPercentage) / 100);
    const platformShare = totalAmount - creatorShare;

    return {
      totalAmount,
      creatorShare,
      platformShare,
      creatorPercentage: rule.creatorPercentage,
      platformPercentage: rule.platformPercentage,
    };
  }

  /**
   * Process earnings for a creator from a viewer payment (gift, tip, private call)
   */
  public processEarning(params: {
    category: 'gift' | 'tip' | 'private_call' | 'default';
    senderId: string;
    creatorId: string;
    totalCoins: number;
    sourceId?: string;
    description: string;
  }): {
    breakdown: RevenueBreakdown;
    updatedEarnings: CreatorEarnings;
  } {
    const { category, senderId, creatorId, totalCoins, sourceId, description } = params;

    const breakdown = this.calculateShare(category, totalCoins);

    // Update Creator Earnings
    const creatorEarnings = ledgerRepository.getCreatorEarnings(creatorId);
    creatorEarnings.totalEarned += breakdown.creatorShare;
    creatorEarnings.withdrawableBalance += breakdown.creatorShare;
    ledgerRepository.saveCreatorEarnings(creatorEarnings);

    // Record Immutable Ledger Entries
    // 1. Viewer Debit (Gift/Tip/Call Sent)
    ledgerService.recordEntry({
      transactionType: category === 'gift' ? 'gift_sent' : category === 'tip' ? 'tip_sent' : 'private_call_payment',
      userId: senderId,
      creatorId,
      sourceId,
      amount: totalCoins,
      currency: 'COIN',
      direction: 'debit',
      description: `${description} (${totalCoins} Coins)`,
    });

    // 2. Creator Earnings Credit
    ledgerService.recordEntry({
      transactionType: category === 'gift' ? 'gift_received' : category === 'tip' ? 'tip_received' : 'creator_earnings',
      userId: creatorId,
      creatorId,
      sourceId,
      amount: breakdown.creatorShare,
      currency: 'COIN',
      direction: 'credit',
      balanceAfter: creatorEarnings.withdrawableBalance,
      description: `Earned ${breakdown.creatorShare} Coins (${breakdown.creatorPercentage}% share from ${category})`,
      metadata: { category, totalCoins, platformShare: breakdown.platformShare },
    });

    // 3. Platform Commission Record
    ledgerService.recordEntry({
      transactionType: 'platform_commission',
      userId: 'PLATFORM',
      creatorId,
      sourceId,
      amount: breakdown.platformShare,
      currency: 'COIN',
      direction: 'credit',
      description: `Platform fee ${breakdown.platformShare} Coins (${breakdown.platformPercentage}% from ${category})`,
      metadata: { category, totalCoins, creatorShare: breakdown.creatorShare },
    });

    Logger.info(
      'RevenueService',
      `Processed ${category} of ${totalCoins} Coins -> Creator ${creatorId}: +${breakdown.creatorShare} Coins, Platform: +${breakdown.platformShare} Coins`
    );

    return {
      breakdown,
      updatedEarnings: creatorEarnings,
    };
  }

  /**
   * Get all revenue rules
   */
  public getRevenueRules(): RevenueShareRule[] {
    return ledgerRepository.getAllRevenueShareRules();
  }

  /**
   * Update or save a revenue share rule
   */
  public updateRevenueRule(rule: RevenueShareRule): RevenueShareRule {
    if (rule.creatorPercentage + rule.platformPercentage !== 100) {
      throw new Error('Creator and Platform percentages must sum to 100%');
    }
    return ledgerRepository.saveRevenueShareRule(rule);
  }
}

export const revenueService = RevenueService.getInstance();
