import { Router } from 'express';
import { discoveryController } from '../controllers/discoveryController';
import { optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// GET /api/v1/discovery
router.get('/', optionalAuthMiddleware, (req, res) => discoveryController.getDiscovery(req, res));

export default router;
