import {
  CreatorEarnings,
  FinancialLedgerEntry,
  WithdrawalRequest,
  WithdrawalTransaction,
  RevenueShareRule,
  SettlementHistory,
} from '../../shared/types';
import { Logger } from '../utils/logger';

export class LedgerRepository {
  private static instance: LedgerRepository;

  private ledgerEntries: FinancialLedgerEntry[] = [];
  private creatorEarningsMap: Map<string, CreatorEarnings> = new Map();
  private withdrawalRequests: Map<string, WithdrawalRequest> = new Map();
  private withdrawalTransactions: Map<string, WithdrawalTransaction> = new Map();
  private revenueShareRules: Map<string, RevenueShareRule> = new Map();
  private settlementHistoryList: SettlementHistory[] = [];

  private minWithdrawalAmount: number = 500; // Minimum 500 Coins
  private coinToFiatRate: number = 0.8; // 1 Coin = ₹0.80 INR (or $0.80)

  private constructor() {
    this.seedDefaultRevenueRules();
  }

  public static getInstance(): LedgerRepository {
    if (!LedgerRepository.instance) {
      LedgerRepository.instance = new LedgerRepository();
    }
    return LedgerRepository.instance;
  }

  private seedDefaultRevenueRules(): void {
    const now = Date.now();
    const defaultRules: RevenueShareRule[] = [
      {
        id: 'rule_gift',
        category: 'gift',
        creatorPercentage: 80,
        platformPercentage: 20,
        description: 'Virtual Gifts (80% Creator / 20% Platform)',
        updatedAt: now,
      },
      {
        id: 'rule_private_call',
        category: 'private_call',
        creatorPercentage: 85,
        platformPercentage: 15,
        description: 'Private 1-on-1 Calls (85% Creator / 15% Platform)',
        updatedAt: now,
      },
      {
        id: 'rule_tip',
        category: 'tip',
        creatorPercentage: 90,
        platformPercentage: 10,
        description: 'Direct Tips (90% Creator / 10% Platform)',
        updatedAt: now,
      },
      {
        id: 'rule_default',
        category: 'default',
        creatorPercentage: 80,
        platformPercentage: 20,
        description: 'Default Platform Share (80% Creator / 20% Platform)',
        updatedAt: now,
      },
    ];

    defaultRules.forEach((rule) => {
      this.revenueShareRules.set(rule.category, rule);
    });

    Logger.info('LedgerRepository', 'Initialized default revenue share rules');
  }

  // --- Financial Ledger Entries (Immutable) ---
  public addLedgerEntry(entry: FinancialLedgerEntry): FinancialLedgerEntry {
    this.ledgerEntries.push(entry);
    Logger.info(
      'LedgerRepository',
      `[LEDGER RECORD] Type: ${entry.transactionType}, User: ${entry.userId}, Amount: ${entry.amount} ${entry.currency}, Dir: ${entry.direction}`
    );
    return entry;
  }

  public getLedgerEntries(filter?: {
    userId?: string;
    creatorId?: string;
    transactionType?: string;
    limit?: number;
  }): FinancialLedgerEntry[] {
    let list = [...this.ledgerEntries];

    if (filter?.userId) {
      list = list.filter((e) => e.userId === filter.userId);
    }
    if (filter?.creatorId) {
      list = list.filter((e) => e.creatorId === filter.creatorId || e.userId === filter.creatorId);
    }
    if (filter?.transactionType) {
      list = list.filter((e) => e.transactionType === filter.transactionType);
    }

    // Sort newest first
    list.sort((a, b) => b.createdAt - a.createdAt);

    if (filter?.limit) {
      list = list.slice(0, filter.limit);
    }

    return list;
  }

  // --- Creator Earnings ---
  public getCreatorEarnings(creatorId: string): CreatorEarnings {
    let earnings = this.creatorEarningsMap.get(creatorId);
    if (!earnings) {
      earnings = {
        creatorId,
        totalEarned: 0,
        withdrawableBalance: 0,
        totalWithdrawn: 0,
        pendingWithdrawal: 0,
        currency: 'COIN',
        lastUpdated: Date.now(),
      };
      this.creatorEarningsMap.set(creatorId, earnings);
    }
    return earnings;
  }

  public saveCreatorEarnings(earnings: CreatorEarnings): CreatorEarnings {
    earnings.lastUpdated = Date.now();
    this.creatorEarningsMap.set(earnings.creatorId, earnings);
    return earnings;
  }

  // --- Revenue Share Rules ---
  public getRevenueShareRule(category: 'gift' | 'tip' | 'private_call' | 'default'): RevenueShareRule {
    return (
      this.revenueShareRules.get(category) ||
      this.revenueShareRules.get('default') || {
        id: 'rule_default',
        category: 'default',
        creatorPercentage: 80,
        platformPercentage: 20,
        updatedAt: Date.now(),
      }
    );
  }

  public getAllRevenueShareRules(): RevenueShareRule[] {
    return Array.from(this.revenueShareRules.values());
  }

  public saveRevenueShareRule(rule: RevenueShareRule): RevenueShareRule {
    rule.updatedAt = Date.now();
    this.revenueShareRules.set(rule.category, rule);
    return rule;
  }

  // --- Withdrawal Requests ---
  public saveWithdrawalRequest(req: WithdrawalRequest): WithdrawalRequest {
    req.updatedAt = Date.now();
    this.withdrawalRequests.set(req.id, req);
    return req;
  }

  public getWithdrawalRequestById(id: string): WithdrawalRequest | undefined {
    return this.withdrawalRequests.get(id);
  }

  public getWithdrawalRequestsByCreatorId(creatorId: string): WithdrawalRequest[] {
    return Array.from(this.withdrawalRequests.values())
      .filter((r) => r.creatorId === creatorId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  public getPendingWithdrawalRequestsByCreatorId(creatorId: string): WithdrawalRequest[] {
    return Array.from(this.withdrawalRequests.values()).filter(
      (r) => r.creatorId === creatorId && (r.status === 'pending' || r.status === 'processing')
    );
  }

  public getAllWithdrawalRequests(statusFilter?: string): WithdrawalRequest[] {
    let list = Array.from(this.withdrawalRequests.values());
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  // --- Withdrawal Transactions ---
  public saveWithdrawalTransaction(tx: WithdrawalTransaction): WithdrawalTransaction {
    this.withdrawalTransactions.set(tx.id, tx);
    return tx;
  }

  // --- Settlement History ---
  public saveSettlementHistory(settlement: SettlementHistory): SettlementHistory {
    this.settlementHistoryList.push(settlement);
    return settlement;
  }

  public getSettlementHistory(creatorId?: string): SettlementHistory[] {
    if (creatorId) {
      return this.settlementHistoryList
        .filter((s) => s.creatorId === creatorId)
        .sort((a, b) => b.settledAt - a.settledAt);
    }
    return [...this.settlementHistoryList].sort((a, b) => b.settledAt - a.settledAt);
  }

  // --- Configuration Getters / Setters ---
  public getMinWithdrawalAmount(): number {
    return this.minWithdrawalAmount;
  }

  public setMinWithdrawalAmount(amount: number): void {
    this.minWithdrawalAmount = amount;
  }

  public getCoinToFiatRate(): number {
    return this.coinToFiatRate;
  }

  public setCoinToFiatRate(rate: number): void {
    this.coinToFiatRate = rate;
  }
}

export const ledgerRepository = LedgerRepository.getInstance();
