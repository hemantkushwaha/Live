import { ledgerRepository } from '../repositories/ledgerRepository';
import {
  FinancialLedgerEntry,
  LedgerTransactionType,
} from '../../shared/types';
import { Logger } from '../utils/logger';

export class LedgerService {
  private static instance: LedgerService;

  public static getInstance(): LedgerService {
    if (!LedgerService.instance) {
      LedgerService.instance = new LedgerService();
    }
    return LedgerService.instance;
  }

  /**
   * Create an immutable ledger entry
   */
  public recordEntry(params: {
    transactionType: LedgerTransactionType;
    userId: string;
    creatorId?: string;
    sourceId?: string;
    amount: number;
    currency?: string;
    direction: 'credit' | 'debit';
    balanceAfter?: number;
    description: string;
    metadata?: Record<string, any>;
  }): FinancialLedgerEntry {
    const entry: FinancialLedgerEntry = {
      id: `ldg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      transactionType: params.transactionType,
      userId: params.userId,
      creatorId: params.creatorId,
      sourceId: params.sourceId,
      amount: Math.abs(params.amount),
      currency: params.currency || 'COIN',
      direction: params.direction,
      balanceAfter: params.balanceAfter,
      description: params.description,
      metadata: params.metadata,
      createdAt: Date.now(),
    };

    return ledgerRepository.addLedgerEntry(entry);
  }

  /**
   * Get ledger history with filters
   */
  public getLedgerHistory(filter?: {
    userId?: string;
    creatorId?: string;
    transactionType?: string;
    limit?: number;
  }): FinancialLedgerEntry[] {
    return ledgerRepository.getLedgerEntries(filter);
  }
}

export const ledgerService = LedgerService.getInstance();
