import { Router } from 'express';
import { HealthController } from '../controllers/healthController';

const router = Router();

// Liveness, Readiness and Health checks
router.get('/health', HealthController.getHealth);
router.get('/v1/health', HealthController.getHealth);
router.get('/api/v1/health', HealthController.getHealth);

router.get('/ready', HealthController.getReadiness);
router.get('/v1/ready', HealthController.getReadiness);
router.get('/api/v1/ready', HealthController.getReadiness);

router.get('/live', HealthController.getLiveness);
router.get('/v1/live', HealthController.getLiveness);
router.get('/api/v1/live', HealthController.getLiveness);

export default router;
