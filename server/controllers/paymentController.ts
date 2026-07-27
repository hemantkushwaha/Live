import { Request, Response } from 'express';
import { coinPurchaseService } from '../services/coinPurchaseService';
import { paymentService } from '../services/paymentService';
import { paymentRepository } from '../repositories/paymentRepository';
import { ApiResponse } from '../../shared/types';
import { Logger } from '../utils/logger';

export class PaymentController {
  /**
   * GET /api/v1/coin-packages
   * Fetch available coin packages
   */
  public async getCoinPackages(req: Request, res: Response): Promise<void> {
    try {
      const packages = coinPurchaseService.getCoinPackages();
      res.status(200).json({
        success: true,
        message: 'Coin packages fetched successfully',
        data: packages,
      } as ApiResponse);
    } catch (error: any) {
      Logger.error('PaymentController', 'Failed to get coin packages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coin packages',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * POST /api/v1/payments/order
   * Create a new payment order for coin purchase
   */
  public async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized: User authentication or userId required',
        } as ApiResponse);
        return;
      }

      const { packageId, provider = 'razorpay', idempotencyKey } = req.body;
      if (!packageId) {
        res.status(400).json({
          success: false,
          message: 'Bad Request: packageId is required',
        } as ApiResponse);
        return;
      }

      const result = await coinPurchaseService.createOrder({
        userId,
        packageId,
        provider,
        idempotencyKey: idempotencyKey || (req.headers['x-idempotency-key'] as string),
      });

      res.status(201).json({
        success: true,
        message: 'Payment order created successfully',
        data: result,
      } as ApiResponse);
    } catch (error: any) {
      Logger.error('PaymentController', 'Failed to create payment order:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create payment order',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * POST /api/v1/payments/verify
   * Verify gateway payment signature & credit coins
   */
  public async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized: User authentication or userId required',
        } as ApiResponse);
        return;
      }

      const {
        orderId,
        gatewayOrderId,
        gatewayPaymentId,
        gatewaySignature,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        status,
      } = req.body;

      if (!orderId && !gatewayOrderId && !razorpay_order_id) {
        res.status(400).json({
          success: false,
          message: 'Bad Request: orderId or gatewayOrderId is required',
        } as ApiResponse);
        return;
      }

      const result = await coinPurchaseService.verifyPayment({
        userId,
        orderId: orderId || '',
        gatewayOrderId: gatewayOrderId || razorpay_order_id,
        gatewayPaymentId: gatewayPaymentId || razorpay_payment_id,
        gatewaySignature: gatewaySignature || razorpay_signature,
        status,
      });

      res.status(200).json({
        success: true,
        message: result.isDuplicate
          ? 'Payment already verified previously'
          : 'Payment verified and coins credited successfully',
        data: result,
      } as ApiResponse);
    } catch (error: any) {
      Logger.error('PaymentController', 'Payment verification failed:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Payment verification failed',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * GET /api/v1/payments/history
   * Get user's payment & transaction history
   */
  public async getPaymentHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req.query.userId as string);
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized: User authentication required',
        } as ApiResponse);
        return;
      }

      const history = coinPurchaseService.getUserPaymentHistory(userId);
      res.status(200).json({
        success: true,
        message: 'Payment history fetched successfully',
        data: history,
      } as ApiResponse);
    } catch (error: any) {
      Logger.error('PaymentController', 'Failed to get payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * POST /api/v1/payments/refund
   * Process refund request for a payment
   */
  public async requestRefund(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      const { paymentId, reason } = req.body;

      if (!userId || !paymentId) {
        res.status(400).json({
          success: false,
          message: 'Bad Request: paymentId and authentication required',
        } as ApiResponse);
        return;
      }

      const refund = await paymentService.processRefund(paymentId, userId, reason || 'User requested refund');
      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: refund,
      } as ApiResponse);
    } catch (error: any) {
      Logger.error('PaymentController', 'Failed to process refund:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Refund processing failed',
        error: error.message,
      } as ApiResponse);
    }
  }
}

export const paymentController = new PaymentController();
