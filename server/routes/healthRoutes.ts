import { Router } from 'express';
import { HealthController } from '../controllers/healthController';

const router = Router();

/**
 * Health check route definition
 * GET /health (mounted under /api/v1, /api, or root)
 */
router.get('/health', HealthController.getHealth);
router.get('/v1/health', HealthController.getHealth);
router.get('/api/v1/health', HealthController.getHealth);

export default router;
