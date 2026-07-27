import { Router } from 'express';
import { withdrawalController } from '../controllers/withdrawalController';
import { authMiddleware } from '../middleware/authMiddleware';
import { authorizationService } from '../services/AuthorizationService';
import { rateLimitService } from '../services/RateLimitService';

const router = Router();
const adminLimiter = rateLimitService.adminLimiter();
const requireAdmin = authorizationService.authorize('admin');
const requireCreator = authorizationService.authorize('creator', { allowSelf: true });

// Creator & User Endpoints
router.get('/earnings', authMiddleware, requireCreator, (req, res) =>
  withdrawalController.getEarningsSummary(req, res)
);

router.get('/ledger', authMiddleware, requireCreator, (req, res) =>
  withdrawalController.getLedgerHistory(req, res)
);

router.post('/withdrawals', authMiddleware, requireCreator, (req, res) =>
  withdrawalController.requestWithdrawal(req, res)
);

router.get('/withdrawals', authMiddleware, requireCreator, (req, res) =>
  withdrawalController.getWithdrawalHistory(req, res)
);

// Admin Financial & Withdrawal Endpoints (Protected by Admin Role & Rate Limiting)
router.get('/admin/withdrawals', adminLimiter, authMiddleware, requireAdmin, (req, res) =>
  withdrawalController.adminGetAllRequests(req, res)
);

router.patch('/admin/withdrawals/:id', adminLimiter, authMiddleware, requireAdmin, (req, res) =>
  withdrawalController.adminProcessRequest(req, res)
);

router.post('/admin/withdrawals/:id', adminLimiter, authMiddleware, requireAdmin, (req, res) =>
  withdrawalController.adminProcessRequest(req, res)
);

router.get('/admin/revenue-rules', adminLimiter, authMiddleware, requireAdmin, (req, res) =>
  withdrawalController.adminGetRevenueRules(req, res)
);

router.put('/admin/revenue-rules', adminLimiter, authMiddleware, requireAdmin, (req, res) =>
  withdrawalController.adminUpdateRevenueRule(req, res)
);

export default router;
