import { UserWallet, WalletTransaction, TransactionType } from '../../shared/types';
import { Logger } from '../utils/logger';
import { cacheService } from './cacheService';

export class WalletService {
  private static instance: WalletService;

  private userWallets: Map<string, UserWallet> = new Map();
  private walletTransactions: Map<string, WalletTransaction[]> = new Map();

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Get user wallet or create a new one with initial 1000 Coins balance
   */
  public getWallet(userId: string): UserWallet {
    if (!userId) {
      throw new Error('User ID is required to access wallet');
    }

    if (!this.userWallets.has(userId)) {
      const walletId = `wallet_${userId}`;
      const now = Date.now();
      const initialWallet: UserWallet = {
        id: walletId,
        userId,
        balance: 1000, // Initial 1000 Coins balance
        createdAt: now,
        updatedAt: now,
        totalTipsSent: 0,
        totalTipsReceived: 0,
      };

      this.userWallets.set(userId, initialWallet);

      // Record initial credit transaction
      const initialTx: WalletTransaction = {
        id: `tx_init_${now}_${Math.random().toString(36).substring(2, 7)}`,
        walletId,
        userId,
        timestamp: now,
        type: 'Credit',
        amount: 1000,
        balanceBefore: 0,
        balanceAfter: 1000,
        description: 'Initial welcome balance (1000 Coins)',
      };

      this.walletTransactions.set(walletId, [initialTx]);
      Logger.info('WalletService', `Created new wallet ${walletId} for user ${userId} with 1000 Coins`);
    }

    return this.userWallets.get(userId)!;
  }

  /**
   * Get transaction history for a user's wallet
   */
  public getHistory(userId: string): WalletTransaction[] {
    const wallet = this.getWallet(userId);
    const history = this.walletTransactions.get(wallet.id) || [];
    // Return sorted newest first
    return [...history].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Execute demo recharge (+100, +500, +1000, +5000 Coins)
   */
  public demoRecharge(
    userId: string,
    amount: number
  ): { wallet: UserWallet; transaction: WalletTransaction } {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid recharge amount. Amount must be a positive number.');
    }

    const wallet = this.getWallet(userId);
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;
    const now = Date.now();

    wallet.balance = balanceAfter;
    wallet.updatedAt = now;
    this.userWallets.set(userId, wallet);
    cacheService.onWalletChange(userId).catch(() => {});

    const transaction: WalletTransaction = {
      id: `tx_recharge_${now}_${Math.random().toString(36).substring(2, 7)}`,
      walletId: wallet.id,
      userId,
      timestamp: now,
      type: 'Recharge',
      amount,
      balanceBefore,
      balanceAfter,
      description: `Demo recharge +${amount} Coins`,
    };

    let txList = this.walletTransactions.get(wallet.id);
    if (!txList) {
      txList = [];
      this.walletTransactions.set(wallet.id, txList);
    }
    txList.push(transaction);

    Logger.info(
      'WalletService',
      `User ${userId} recharged +${amount} Coins. New balance: ${balanceAfter}`
    );

    return { wallet, transaction };
  }

  /**
   * Helper method to deduct funds (debit) or credit funds for tips/gifts
   */
  public recordTransaction(
    userId: string,
    type: TransactionType,
    amount: number,
    description: string
  ): { wallet: UserWallet; transaction: WalletTransaction } {
    const wallet = this.getWallet(userId);
    const balanceBefore = wallet.balance;

    let balanceAfter = balanceBefore;
    if (type === 'Debit' || type === 'Gift' || type === 'Tip' || type === 'Private Call') {
      if (balanceBefore < amount) {
        throw new Error(`Insufficient wallet balance. Balance: ${balanceBefore}, required: ${amount}`);
      }
      balanceAfter = balanceBefore - amount;
    } else if (type === 'Credit' || type === 'Recharge') {
      balanceAfter = balanceBefore + amount;
    }

    const now = Date.now();
    wallet.balance = balanceAfter;
    wallet.updatedAt = now;
    this.userWallets.set(userId, wallet);
    cacheService.onWalletChange(userId).catch(() => {});

    const transaction: WalletTransaction = {
      id: `tx_${type.toLowerCase()}_${now}_${Math.random().toString(36).substring(2, 7)}`,
      walletId: wallet.id,
      userId,
      timestamp: now,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      description,
    };

    let txList = this.walletTransactions.get(wallet.id);
    if (!txList) {
      txList = [];
      this.walletTransactions.set(wallet.id, txList);
    }
    txList.push(transaction);

    return { wallet, transaction };
  }
}

export const walletService = WalletService.getInstance();
