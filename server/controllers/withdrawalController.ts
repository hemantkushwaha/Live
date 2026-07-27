import { Request, Response } from 'express';
import { withdrawalService } from '../services/withdrawalService';
import { ledgerService } from '../services/ledgerService';
import { revenueService } from '../services/revenueService';
import { ApiResponse } from '../../shared/types';
import { Logger } from '../utils/logger';

export class WithdrawalController {
  /**
   * GET /api/v1/earnings
   * Get creator earnings and financial summary
   */
  public async getEarningsSummary(req: Request, res: Response): Promise<void> {
    try {
      const creatorId = (req as any).user?.id || (req.query.creatorId as string);
      if (!creatorId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized: Creator authentication required',
        } as ApiResponse);
        return;
      }

      const summary = withdrawalService.getCreatorFinancialSummary(creatorId);
      res.status(200).json({
        success: true,
        message: 'Creator earnings summary fetched successfully',
        data: summary,
      } as ApiResponse);
    } catch (error: any) {
      Logger.error('WithdrawalController', 'Failed to fetch earnings summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch earnings summary',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * GET /api/v1/ledger
   * Fetch immutable financial ledger history
   */
  public async getLedgerHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req.query.userId as string);
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized: User authentication required',
        } as ApiResponse);
        return;
      }

      const transactionType = req.query.transactionType as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const entries = ledgerService.getLedgerHistory({
        userId,
        creatorId: userId,
        transactionType,
        limit,
      });

      res.status(200).json({
        success: true,
        message: 'Financial ledger history fetched successfully',
        data: entries,
      } as ApiResponse);
    } catch (error: any) {
      Logger.error('WithdrawalController', 'Failed to fetch ledger history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch financial ledger history',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * POST /api/v1/withdrawals
   * Request a new withdrawal
   */
  public async requestWithdrawal(req: Request, res: Response): Promise<void> {
    try {
      const creatorId = (req as any).user?.id || req.body.creatorId;
      const creatorName = (req as any).user?.name || (req as any).user?.email || req.body.creatorName;

      if (!creatorId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized: Creator authentication required',
        } as ApiResponse);
        return;
      }

      const { amount, paymentMethod, payoutDetails } = req.body;

      if (!amount || !paymentMethod || !payoutDetails) {
        res.status(400).json({
          success: false,
          message: 'Bad Request: amount, paymentMethod, and payoutDetails are required',
        } as ApiResponse);
        return;
      }

      const request = await withdrawalService.requestWithdrawal({
        creatorId,
        creatorName,
        amount: Number(amount),
        paymentMethod,
        payoutDetails,
      });

      res.status(201).json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        data: request,
      } as ApiResponse);
    } catch (error: any) {
      Logger.error('WithdrawalController', 'Failed to submit withdrawal request:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to submit withdrawal request',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * GET /api/v1/withdrawals
   * Get creator's withdrawal history
   */
  public async getWithdrawalHistory(req: Request, res: Response): Promise<void> {
    try {
      const creatorId = (req as any).user?.id || (req.query.creatorId as string);
      if (!creatorId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized: Creator authentication required',
        } as ApiResponse);
        return;
      }

      const summary = withdrawalService.getCreatorFinancialSummary(creatorId);
      res.status(200).json({
        success: true,
        message: 'Withdrawal history fetched successfully',
        data: summary.withdrawalHistory,
      } as ApiResponse);
    } catch (error: any) {
      Logger.error('WithdrawalController', 'Failed to fetch withdrawal history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch withdrawal history',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * GET /api/v1/admin/withdrawals
   * Admin: List all withdrawal requests
   */
  public async adminGetAllRequests(req: Request, res: Response): Promise<void> {
    try {
      const statusFilter = (req.query.status as string) || 'all';
      const requests = withdrawalService.getAllRequests(statusFilter);

      res.status(200).json({
        success: true,
        message: 'Admin withdrawal requests fetched successfully',
        data: requests,
      } as ApiResponse);
    } catch (error: any) {
      Logger.error('WithdrawalController', 'Failed admin fetch withdrawal requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch withdrawal requests',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * PATCH /api/v1/admin/withdrawals/:id
   * Admin: Approve or Reject a withdrawal request
   */
  public async adminProcessRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.id;
      const { action, remarks } = req.body;
      const adminUserId = (req as any).user?.id || 'admin_sys';

      if (!action || (action !== 'approve' && action !== 'reject')) {
        res.status(400).json({
          success: false,
          message: "Bad Request: action must be either 'approve' or 'reject'",
        } as ApiResponse);
        return;
      }

      const result = await withdrawalService.adminProcessWithdrawal({
        requestId,
        action,
        adminUserId,
        adminRemarks: remarks,
      });

      res.status(200).json({
        success: true,
        message: `Withdrawal request ${action}d successfully`,
        data: result,
      } as ApiResponse);
    } catch (error: any) {
      Logger.error('WithdrawalController', 'Failed admin process request:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process withdrawal request',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * GET /api/v1/admin/revenue-rules
   * Admin: Get all revenue share rules
   */
  public async adminGetRevenueRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = revenueService.getRevenueRules();
      res.status(200).json({
        success: true,
        message: 'Revenue rules fetched successfully',
        data: rules,
      } as ApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch revenue rules',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * PUT /api/v1/admin/revenue-rules
   * Admin: Update a revenue share rule
   */
  public async adminUpdateRevenueRule(req: Request, res: Response): Promise<void> {
    try {
      const { id, category, creatorPercentage, platformPercentage, description } = req.body;
      if (!category || typeof creatorPercentage !== 'number' || typeof platformPercentage !== 'number') {
        res.status(400).json({
          success: false,
          message: 'Bad Request: category, creatorPercentage, and platformPercentage required',
        } as ApiResponse);
        return;
      }

      const updated = revenueService.updateRevenueRule({
        id: id || `rule_${category}`,
        category,
        creatorPercentage,
        platformPercentage,
        description,
        updatedAt: Date.now(),
      });

      res.status(200).json({
        success: true,
        message: 'Revenue share rule updated successfully',
        data: updated,
      } as ApiResponse);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update revenue share rule',
        error: error.message,
      } as ApiResponse);
    }
  }
}

export const withdrawalController = new WithdrawalController();
