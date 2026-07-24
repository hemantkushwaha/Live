import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { walletService } from '../services/walletService';
import { ApiResponse, UserWallet, WalletTransaction } from '../../shared/types';

export class WalletController {
  private static instance: WalletController;

  public static getInstance(): WalletController {
    if (!WalletController.instance) {
      WalletController.instance = new WalletController();
    }
    return WalletController.instance;
  }

  /**
   * GET /api/v1/wallet
   */
  public async getWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const wallet = walletService.getWallet(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Wallet retrieved successfully',
        data: wallet,
      } as ApiResponse<UserWallet>);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve wallet',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * GET /api/v1/wallet/history
   */
  public async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const history = walletService.getHistory(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Transaction history retrieved successfully',
        data: history,
      } as ApiResponse<WalletTransaction[]>);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction history',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * POST /api/v1/wallet/demo-recharge
   */
  public async demoRecharge(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { amount } = req.body || {};
      const numAmount = Number(amount);

      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid recharge amount',
          error: 'Recharge amount must be a positive number',
        } as ApiResponse);
        return;
      }

      const result = walletService.demoRecharge(req.user.id, numAmount);

      res.status(200).json({
        success: true,
        message: `Successfully recharged +${numAmount} Coins`,
        data: result,
      } as ApiResponse<{ wallet: UserWallet; transaction: WalletTransaction }>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Demo recharge failed',
        error: error.message,
      } as ApiResponse);
    }
  }
}

export const walletController = WalletController.getInstance();
