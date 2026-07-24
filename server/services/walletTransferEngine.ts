import { walletService } from './walletService';
import { UserWallet, WalletTransaction } from '../../shared/types';
import { Logger } from '../utils/logger';

export interface TransferResult {
  success: boolean;
  amount: number;
  viewerWallet: UserWallet;
  creatorWallet: UserWallet;
  viewerTransaction: WalletTransaction;
  creatorTransaction: WalletTransaction;
}

export class WalletTransferEngine {
  private static instance: WalletTransferEngine;

  public static getInstance(): WalletTransferEngine {
    if (!WalletTransferEngine.instance) {
      WalletTransferEngine.instance = new WalletTransferEngine();
    }
    return WalletTransferEngine.instance;
  }

  /**
   * Transfer coins from viewer to creator for private call minute billing
   */
  public transferCoins(
    viewerId: string,
    creatorId: string,
    amount: number,
    description: string
  ): TransferResult {
    if (!viewerId || !creatorId) {
      throw new Error('Viewer ID and Creator ID are required for wallet transfer');
    }

    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Transfer amount must be a positive number');
    }

    const viewerWallet = walletService.getWallet(viewerId);
    if (viewerWallet.balance < amount) {
      throw new Error(
        `Insufficient Coins: Viewer balance (${viewerWallet.balance} Coins) is less than required (${amount} Coins)`
      );
    }

    // Deduct from viewer
    const viewerDebit = walletService.recordTransaction(
      viewerId,
      'Private Call',
      amount,
      `Debit: ${description}`
    );

    // Credit to creator
    const creatorCredit = walletService.recordTransaction(
      creatorId,
      'Credit',
      amount,
      `Credit: ${description}`
    );

    Logger.info(
      'WalletTransferEngine',
      `Transferred ${amount} Coins from Viewer ${viewerId} to Creator ${creatorId}. New balances -> Viewer: ${viewerDebit.wallet.balance}, Creator: ${creatorCredit.wallet.balance}`
    );

    return {
      success: true,
      amount,
      viewerWallet: viewerDebit.wallet,
      creatorWallet: creatorCredit.wallet,
      viewerTransaction: viewerDebit.transaction,
      creatorTransaction: creatorCredit.transaction,
    };
  }
}

export const walletTransferEngine = WalletTransferEngine.getInstance();
