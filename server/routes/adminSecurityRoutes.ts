import { Router } from 'express';
import { adminSecurityController } from '../controllers/adminSecurityController';
import { authMiddleware } from '../middleware/authMiddleware';
import { authorizationService } from '../services/AuthorizationService';
import { rateLimitService } from '../services/RateLimitService';

const router = Router();

const adminLimiter = rateLimitService.adminLimiter();
const requireAdmin = authorizationService.authorize('admin');

router.get(
  '/audit-logs',
  adminLimiter,
  authMiddleware,
  requireAdmin,
  (req, res, next) => adminSecurityController.getAuditLogs(req, res, next)
);

router.get(
  '/audit-integrity',
  adminLimiter,
  authMiddleware,
  requireAdmin,
  (req, res, next) => adminSecurityController.verifyAuditIntegrity(req, res, next)
);

router.get(
  '/security-summary',
  adminLimiter,
  authMiddleware,
  requireAdmin,
  (req, res, next) => adminSecurityController.getSecuritySummary(req, res, next)
);

export default router;
