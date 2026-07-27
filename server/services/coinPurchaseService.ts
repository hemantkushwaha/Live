import { paymentRepository } from '../repositories/paymentRepository';
import { paymentService } from './paymentService';
import { walletService } from './walletService';
import { ledgerService } from './ledgerService';
import { RazorpayProvider } from './payment/RazorpayProvider';
import {
  CoinPackage,
  PaymentOrder,
  Payment,
  PaymentReceipt,
  UserWallet,
} from '../../shared/types';
import { Logger } from '../utils/logger';

export interface CreateOrderRequest {
  userId: string;
  packageId: string;
  provider?: string;
  idempotencyKey?: string;
}

export interface VerifyPaymentRequest {
  userId: string;
  orderId: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  status?: string; // 'cancelled', 'failed', etc.
}

export interface VerifyPaymentResponse {
  payment: Payment;
  receipt: PaymentReceipt;
  wallet: UserWallet;
  isDuplicate?: boolean;
}

export class CoinPurchaseService {
  private static instance: CoinPurchaseService;

  public static getInstance(): CoinPurchaseService {
    if (!CoinPurchaseService.instance) {
      CoinPurchaseService.instance = new CoinPurchaseService();
    }
    return CoinPurchaseService.instance;
  }

  /**
   * Get all active coin packages
   */
  public getCoinPackages(): CoinPackage[] {
    return paymentRepository.getCoinPackages(true);
  }

  /**
   * Create an order for a coin package purchase
   */
  public async createOrder(req: CreateOrderRequest): Promise<{
    order: PaymentOrder;
    keyId?: string;
    gatewayOrder: any;
  }> {
    const { userId, packageId, provider: requestedProvider = 'razorpay', idempotencyKey } = req;

    // Check idempotency if key provided
    if (idempotencyKey) {
      const existingOrder = paymentRepository.getOrderByIdempotencyKey(idempotencyKey);
      if (existingOrder) {
        Logger.info('CoinPurchaseService', `Returning existing order for idempotency key ${idempotencyKey}`);
        const providerObj = paymentService.getProvider(existingOrder.provider);
        let keyId: string | undefined;
        if (providerObj instanceof RazorpayProvider) {
          keyId = providerObj.getKeyId();
        }
        return {
          order: existingOrder,
          keyId,
          gatewayOrder: { id: existingOrder.gatewayOrderId, amount: existingOrder.amount * 100 },
        };
      }
    }

    // Validate package
    const coinPackage = paymentRepository.getCoinPackageById(packageId);
    if (!coinPackage || !coinPackage.active) {
      throw new Error(`Coin package '${packageId}' is invalid or inactive`);
    }

    const providerObj = paymentService.getProvider(requestedProvider);
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const totalCoins = coinPackage.coins + (coinPackage.bonusCoins || 0);

    // Create order with gateway provider
    const gatewayResult = await providerObj.createOrder({
      orderId,
      amount: coinPackage.price,
      currency: coinPackage.currency,
      userId,
      description: `Purchase ${totalCoins} Coins (${coinPackage.name})`,
      receipt: `rcpt_${orderId}`,
    });

    const now = Date.now();
    const order: PaymentOrder = {
      id: orderId,
      userId,
      packageId: coinPackage.id,
      coins: totalCoins,
      amount: coinPackage.price,
      currency: coinPackage.currency,
      provider: providerObj.getProviderId(),
      status: 'pending',
      gatewayOrderId: gatewayResult.gatewayOrderId,
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
    };

    paymentRepository.saveOrder(order);

    paymentService.recordEvent(
      order.provider,
      'order.created',
      { packageId, coins: totalCoins, amount: coinPackage.price },
      order.id,
      undefined,
      userId
    );

    let keyId: string | undefined;
    if (providerObj instanceof RazorpayProvider) {
      keyId = providerObj.getKeyId();
    }

    Logger.info('CoinPurchaseService', `Created payment order ${order.id} for user ${userId}, package ${packageId}`);

    return {
      order,
      keyId,
      gatewayOrder: gatewayResult.rawResponse || {
        id: gatewayResult.gatewayOrderId,
        amount: gatewayResult.amount,
        currency: gatewayResult.currency,
      },
    };
  }

  /**
   * Verify payment signature and credit coins to user wallet
   */
  public async verifyPayment(req: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    const { userId, orderId } = req;

    // Normalize parameters (support both standard and razorpay-prefixed field names)
    const gatewayOrderId = req.gatewayOrderId || req.razorpay_order_id;
    const gatewayPaymentId = req.gatewayPaymentId || req.razorpay_payment_id;
    const gatewaySignature = req.gatewaySignature || req.razorpay_signature;

    // Find local order
    let order = paymentRepository.getOrderById(orderId);
    if (!order && gatewayOrderId) {
      order = paymentRepository.getOrderByGatewayOrderId(gatewayOrderId);
    }

    if (!order) {
      throw new Error(`Payment order '${orderId}' not found`);
    }

    if (order.userId !== userId) {
      throw new Error('Unauthorized: Order does not belong to the requesting user');
    }

    // Handle cancellation or user failure explicitly passed from frontend
    if (req.status === 'cancelled' || req.status === 'failed') {
      order.status = req.status;
      order.updatedAt = Date.now();
      paymentRepository.saveOrder(order);

      paymentService.recordEvent(
        order.provider,
        `payment.${req.status}`,
        { orderId: order.id, status: req.status },
        order.id,
        undefined,
        userId
      );

      throw new Error(`Payment was ${req.status}`);
    }

    // Idempotency check: if order is already completed / captured, return existing payment without double-crediting
    if (order.status === 'completed') {
      const existingPayment = paymentRepository.getPaymentByOrderId(order.id);
      if (existingPayment) {
        Logger.info(
          'CoinPurchaseService',
          `Duplicate callback received for completed order ${order.id}. Returning existing payment.`
        );

        const currentWallet = walletService.getWallet(userId);
        const receipt: PaymentReceipt = {
          paymentId: existingPayment.id,
          gatewayOrderId: existingPayment.gatewayOrderId || order.gatewayOrderId || '',
          gatewayTransactionId: existingPayment.gatewayPaymentId,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          coinsPurchased: existingPayment.coinsCredited,
          timestamp: existingPayment.createdAt,
          status: existingPayment.status,
          userWalletBalanceAfter: currentWallet.balance,
        };

        return {
          payment: existingPayment,
          receipt,
          wallet: currentWallet,
          isDuplicate: true,
        };
      }
    }

    // Verify signature with gateway provider
    const providerObj = paymentService.getProvider(order.provider);
    const verification = await providerObj.verifyPayment({
      orderId: order.id,
      gatewayOrderId: gatewayOrderId || order.gatewayOrderId || '',
      gatewayPaymentId: gatewayPaymentId || `pay_sim_${Date.now()}`,
      gatewaySignature,
    });

    if (!verification.verified || verification.status !== 'captured') {
      order.status = 'failed';
      order.updatedAt = Date.now();
      paymentRepository.saveOrder(order);

      paymentService.recordEvent(
        order.provider,
        'payment.failed',
        { reason: verification.errorReason || 'Verification failed' },
        order.id,
        undefined,
        userId
      );

      throw new Error(verification.errorReason || 'Payment signature verification failed');
    }

    // Mark order as completed
    const now = Date.now();
    order.status = 'completed';
    order.updatedAt = now;
    paymentRepository.saveOrder(order);

    // Credit coins to user wallet via WalletService
    const transactionDesc = `Purchased ${order.coins} Coins (Order #${order.id.slice(-6)})`;
    const { wallet: updatedWallet } = walletService.recordTransaction(
      userId,
      'Recharge',
      order.coins,
      transactionDesc
    );

    // Create payment record
    const paymentId = `pay_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const receiptNumber = `RCPT-${now}-${order.id.slice(-5).toUpperCase()}`;

    const paymentRecord: Payment = {
      id: paymentId,
      orderId: order.id,
      userId,
      gatewayPaymentId: verification.gatewayPaymentId,
      gatewayOrderId: verification.gatewayOrderId,
      gatewaySignature,
      provider: order.provider,
      amount: order.amount,
      currency: order.currency,
      coinsCredited: order.coins,
      status: 'captured',
      receiptNumber,
      createdAt: now,
    };

    paymentRepository.savePayment(paymentRecord);

    // Record Immutable Ledger Entry
    ledgerService.recordEntry({
      transactionType: 'coin_purchase',
      userId,
      sourceId: order.id,
      amount: order.coins,
      currency: 'COIN',
      direction: 'credit',
      balanceAfter: updatedWallet.balance,
      description: `Coin Package Purchase (${order.coins} Coins for ${order.currency} ${order.amount})`,
      metadata: { provider: order.provider, packageId: order.packageId, amountPaid: order.amount },
    });

    paymentService.recordEvent(
      order.provider,
      'payment.captured',
      { paymentId, gatewayPaymentId: verification.gatewayPaymentId, coins: order.coins },
      order.id,
      paymentId,
      userId
    );

    const receipt: PaymentReceipt = {
      paymentId,
      gatewayOrderId: verification.gatewayOrderId,
      gatewayTransactionId: verification.gatewayPaymentId,
      amount: order.amount,
      currency: order.currency,
      coinsPurchased: order.coins,
      timestamp: now,
      status: 'captured',
      userWalletBalanceAfter: updatedWallet.balance,
    };

    Logger.info(
      'CoinPurchaseService',
      `Payment ${paymentId} verified and captured. Credited +${order.coins} Coins to user ${userId}. New balance: ${updatedWallet.balance}`
    );

    return {
      payment: paymentRecord,
      receipt,
      wallet: updatedWallet,
    };
  }

  /**
   * Get purchase and payment history for a user
   */
  public getUserPaymentHistory(userId: string): {
    payments: Payment[];
    orders: PaymentOrder[];
    receipts: PaymentReceipt[];
  } {
    const payments = paymentRepository.getPaymentsByUserId(userId);
    const orders = paymentRepository.getOrdersByUserId(userId);
    const receipts: PaymentReceipt[] = payments.map((p) => ({
      paymentId: p.id,
      gatewayOrderId: p.gatewayOrderId || '',
      gatewayTransactionId: p.gatewayPaymentId,
      amount: p.amount,
      currency: p.currency,
      coinsPurchased: p.coinsCredited,
      timestamp: p.createdAt,
      status: p.status,
    }));

    return { payments, orders, receipts };
  }
}

export const coinPurchaseService = CoinPurchaseService.getInstance();
