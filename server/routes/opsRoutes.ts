import { Router } from 'express';
import { opsController } from '../controllers/opsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { authorizationService } from '../services/AuthorizationService';
import { rateLimitService } from '../services/RateLimitService';

const router = Router();
const adminLimiter = rateLimitService.adminLimiter();
const requireAdmin = authorizationService.authorize('admin');

router.get('/metrics', adminLimiter, authMiddleware, requireAdmin, (req, res, next) =>
  opsController.getMetrics(req, res, next)
);

router.get('/alerts', adminLimiter, authMiddleware, requireAdmin, (req, res, next) =>
  opsController.getAlerts(req, res, next)
);

router.get('/logs', adminLimiter, authMiddleware, requireAdmin, (req, res, next) =>
  opsController.getLogs(req, res, next)
);

router.get('/backups', adminLimiter, authMiddleware, requireAdmin, (req, res, next) =>
  opsController.getBackups(req, res, next)
);

router.post('/backups/trigger', adminLimiter, authMiddleware, requireAdmin, (req, res, next) =>
  opsController.triggerBackup(req, res, next)
);

router.get('/ci-status', adminLimiter, authMiddleware, requireAdmin, (req, res, next) =>
  opsController.getCICDStatus(req, res, next)
);

// Public health & monitoring fallback
router.get('/public-metrics', (req, res, next) =>
  opsController.getMetrics(req, res, next)
);

export default router;
