import { Router } from 'express';
import { creatorDashboardController } from '../controllers/creatorDashboardController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', (req, res) => creatorDashboardController.getDashboard(req, res));
router.get('/analytics', (req, res) => creatorDashboardController.getAnalytics(req, res));

export default router;
