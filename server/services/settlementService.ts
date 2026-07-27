import { ledgerRepository } from '../repositories/ledgerRepository';
import { WithdrawalRequest, SettlementHistory, WithdrawalTransaction } from '../../shared/types';
import { Logger } from '../utils/logger';

export class SettlementService {
  private static instance: SettlementService;

  public static getInstance(): SettlementService {
    if (!SettlementService.instance) {
      SettlementService.instance = new SettlementService();
    }
    return SettlementService.instance;
  }

  /**
   * Settle an approved withdrawal request
   */
  public createSettlement(params: {
    request: WithdrawalRequest;
    adminUserId: string;
    remarks?: string;
  }): { settlement: SettlementHistory; transaction: WithdrawalTransaction } {
    const { request, adminUserId, remarks } = params;

    const settlement: SettlementHistory = {
      id: `stl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      creatorId: request.creatorId,
      withdrawalRequestId: request.id,
      amount: request.amount,
      currency: request.currency,
      payoutAmount: request.payoutAmount,
      settledAt: Date.now(),
      adminUserId,
      remarks: remarks || request.adminRemarks,
    };

    ledgerRepository.saveSettlementHistory(settlement);

    const transaction: WithdrawalTransaction = {
      id: `wtx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      requestId: request.id,
      creatorId: request.creatorId,
      amount: request.amount,
      currency: request.currency,
      payoutAmount: request.payoutAmount,
      status: request.status,
      transactionRef: `REF-${Date.now()}-${request.id.slice(-6).toUpperCase()}`,
      processedAt: Date.now(),
    };

    ledgerRepository.saveWithdrawalTransaction(transaction);

    Logger.info(
      'SettlementService',
      `Settled withdrawal request ${request.id} for creator ${request.creatorId}: ${request.amount} Coins (Payout: ₹${request.payoutAmount})`
    );

    return { settlement, transaction };
  }

  public getSettlementHistory(creatorId?: string): SettlementHistory[] {
    return ledgerRepository.getSettlementHistory(creatorId);
  }
}

export const settlementService = SettlementService.getInstance();
