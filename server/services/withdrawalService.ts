import { ledgerRepository } from '../repositories/ledgerRepository';
import { ledgerService } from './ledgerService';
import { settlementService } from './settlementService';
import {
  CreatorEarnings,
  CreatorFinancialSummary,
  WithdrawalRequest,
  WithdrawalStatus,
} from '../../shared/types';
import { Logger } from '../utils/logger';

export interface CreateWithdrawalParams {
  creatorId: string;
  creatorName?: string;
  amount: number; // in Coins
  paymentMethod: 'bank_transfer' | 'upi' | 'paypal';
  payoutDetails: {
    bankAccount?: string;
    ifsc?: string;
    accountHolder?: string;
    upiId?: string;
    paypalEmail?: string;
  };
}

export interface AdminProcessParams {
  requestId: string;
  action: 'approve' | 'reject';
  adminUserId: string;
  adminRemarks?: string;
}

export class WithdrawalService {
  private static instance: WithdrawalService;

  public static getInstance(): WithdrawalService {
    if (!WithdrawalService.instance) {
      WithdrawalService.instance = new WithdrawalService();
    }
    return WithdrawalService.instance;
  }

  /**
   * Fetch complete financial summary for a creator
   */
  public getCreatorFinancialSummary(creatorId: string): CreatorFinancialSummary {
    const earnings = ledgerRepository.getCreatorEarnings(creatorId);
    const revenueShareRules = ledgerRepository.getAllRevenueShareRules();
    const recentLedgerEntries = ledgerRepository.getLedgerEntries({
      creatorId,
      limit: 50,
    });
    const withdrawalHistory = ledgerRepository.getWithdrawalRequestsByCreatorId(creatorId);

    return {
      earnings,
      revenueShareRules,
      recentLedgerEntries,
      withdrawalHistory,
      minWithdrawalAmount: ledgerRepository.getMinWithdrawalAmount(),
      coinToFiatRate: ledgerRepository.getCoinToFiatRate(),
    };
  }

  /**
   * Creator submits a new withdrawal request
   */
  public async requestWithdrawal(params: CreateWithdrawalParams): Promise<WithdrawalRequest> {
    const { creatorId, creatorName, amount, paymentMethod, payoutDetails } = params;

    const minAmount = ledgerRepository.getMinWithdrawalAmount();
    const coinToFiatRate = ledgerRepository.getCoinToFiatRate();

    // 1. Amount validation
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new Error('Withdrawal amount must be a positive number greater than zero.');
    }

    if (amount < minAmount) {
      throw new Error(
        `Minimum withdrawal amount is ${minAmount} Coins. Requested amount: ${amount} Coins.`
      );
    }

    // 2. Pending Requests Check (block duplicate/concurrent pending requests)
    const pendingRequests = ledgerRepository.getPendingWithdrawalRequestsByCreatorId(creatorId);
    if (pendingRequests.length > 0) {
      throw new Error(
        'You already have an active pending withdrawal request. Please wait for admin approval before requesting another.'
      );
    }

    // 3. Balance Check
    const earnings = ledgerRepository.getCreatorEarnings(creatorId);
    if (earnings.withdrawableBalance < amount) {
      throw new Error(
        `Insufficient withdrawable balance. Available: ${earnings.withdrawableBalance} Coins, requested: ${amount} Coins.`
      );
    }

    // 4. Lock Coins (Deduct from withdrawableBalance, add to pendingWithdrawal)
    earnings.withdrawableBalance -= amount;
    earnings.pendingWithdrawal += amount;
    ledgerRepository.saveCreatorEarnings(earnings);

    // 5. Calculate Fiat Payout Amount
    const payoutAmount = Math.round(amount * coinToFiatRate * 100) / 100;
    const now = Date.now();
    const requestId = `wdr_${now}_${Math.random().toString(36).substring(2, 7)}`;

    // 6. Record Immutable Ledger Entry
    ledgerService.recordEntry({
      transactionType: 'withdrawal_request',
      userId: creatorId,
      creatorId,
      sourceId: requestId,
      amount,
      currency: 'COIN',
      direction: 'debit',
      balanceAfter: earnings.withdrawableBalance,
      description: `Requested withdrawal of ${amount} Coins (Payout: ₹${payoutAmount})`,
      metadata: { paymentMethod, payoutAmount, payoutDetails },
    });

    // 7. Save Withdrawal Request
    const request: WithdrawalRequest = {
      id: requestId,
      creatorId,
      creatorName: creatorName || `Creator ${creatorId.slice(-4)}`,
      amount,
      currency: 'COIN',
      conversionRate: coinToFiatRate,
      payoutAmount,
      paymentMethod,
      payoutDetails,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    ledgerRepository.saveWithdrawalRequest(request);

    Logger.info(
      'WithdrawalService',
      `Creator ${creatorId} requested withdrawal of ${amount} Coins. Locked to pending. New withdrawable balance: ${earnings.withdrawableBalance}`
    );

    return request;
  }

  /**
   * Admin approves or rejects a withdrawal request
   */
  public async adminProcessWithdrawal(params: AdminProcessParams): Promise<{
    request: WithdrawalRequest;
    earnings: CreatorEarnings;
  }> {
    const { requestId, action, adminUserId, adminRemarks } = params;

    const request = ledgerRepository.getWithdrawalRequestById(requestId);
    if (!request) {
      throw new Error(`Withdrawal request '${requestId}' not found`);
    }

    if (request.status !== 'pending' && request.status !== 'processing') {
      throw new Error(
        `Cannot ${action} request with status '${request.status}'. Request is already processed.`
      );
    }

    const earnings = ledgerRepository.getCreatorEarnings(request.creatorId);
    const now = Date.now();

    if (action === 'approve') {
      // APPROVE: deduct from pendingWithdrawal, add to totalWithdrawn
      earnings.pendingWithdrawal = Math.max(0, earnings.pendingWithdrawal - request.amount);
      earnings.totalWithdrawn += request.amount;
      ledgerRepository.saveCreatorEarnings(earnings);

      request.status = 'approved';
      request.adminRemarks = adminRemarks || 'Approved by Admin';
      request.processedBy = adminUserId;
      request.updatedAt = now;

      ledgerRepository.saveWithdrawalRequest(request);

      // Record Ledger Entry
      ledgerService.recordEntry({
        transactionType: 'withdrawal_approved',
        userId: adminUserId,
        creatorId: request.creatorId,
        sourceId: request.id,
        amount: request.amount,
        currency: 'COIN',
        direction: 'debit',
        balanceAfter: earnings.withdrawableBalance,
        description: `Withdrawal APPROVED by Admin. ${request.amount} Coins (Payout: ₹${request.payoutAmount})`,
        metadata: { payoutAmount: request.payoutAmount, remarks: adminRemarks },
      });

      // Create Settlement Entry
      settlementService.createSettlement({
        request,
        adminUserId,
        remarks: adminRemarks,
      });

      Logger.info(
        'WithdrawalService',
        `Admin ${adminUserId} APPROVED withdrawal ${requestId} for creator ${request.creatorId}`
      );
    } else if (action === 'reject') {
      // REJECT: deduct from pendingWithdrawal, restore/add back to withdrawableBalance
      earnings.pendingWithdrawal = Math.max(0, earnings.pendingWithdrawal - request.amount);
      earnings.withdrawableBalance += request.amount;
      ledgerRepository.saveCreatorEarnings(earnings);

      request.status = 'rejected';
      request.adminRemarks = adminRemarks || 'Rejected by Admin';
      request.processedBy = adminUserId;
      request.updatedAt = now;

      ledgerRepository.saveWithdrawalRequest(request);

      // Record Ledger Entry
      ledgerService.recordEntry({
        transactionType: 'withdrawal_rejected',
        userId: adminUserId,
        creatorId: request.creatorId,
        sourceId: request.id,
        amount: request.amount,
        currency: 'COIN',
        direction: 'credit',
        balanceAfter: earnings.withdrawableBalance,
        description: `Withdrawal REJECTED by Admin. ${request.amount} Coins restored to withdrawable balance.`,
        metadata: { remarks: adminRemarks },
      });

      Logger.info(
        'WithdrawalService',
        `Admin ${adminUserId} REJECTED withdrawal ${requestId} for creator ${request.creatorId}. Restored ${request.amount} Coins.`
      );
    }

    return { request, earnings };
  }

  /**
   * Admin list all requests with filter
   */
  public getAllRequests(statusFilter?: string): WithdrawalRequest[] {
    return ledgerRepository.getAllWithdrawalRequests(statusFilter);
  }
}

export const withdrawalService = WithdrawalService.getInstance();
