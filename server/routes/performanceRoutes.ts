import { Router } from 'express';
import { performanceController } from '../controllers/performanceController';
import { authMiddleware } from '../middleware/authMiddleware';
import { authorizationService } from '../services/AuthorizationService';
import { rateLimitService } from '../services/RateLimitService';

const router = Router();
const adminLimiter = rateLimitService.adminLimiter();
const requireAdmin = authorizationService.authorize('admin');

router.get('/metrics', adminLimiter, authMiddleware, requireAdmin, (req, res, next) =>
  performanceController.getMetrics(req, res, next)
);

router.post('/load-test', adminLimiter, authMiddleware, requireAdmin, (req, res, next) =>
  performanceController.runLoadTest(req, res, next)
);

router.get('/scalability-report', adminLimiter, authMiddleware, requireAdmin, (req, res, next) =>
  performanceController.getScalabilityReport(req, res, next)
);

// Public / benchmark access for automated verification
router.get('/benchmark', (req, res, next) =>
  performanceController.getScalabilityReport(req, res, next)
);

export default router;
