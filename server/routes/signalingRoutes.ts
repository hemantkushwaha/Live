import { Router } from 'express';
import { signalingController } from '../controllers/signalingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// GET /api/v1/signaling/sessions/:streamId
router.get('/sessions/:streamId', authMiddleware, (req, res) => signalingController.getSessions(req, res));

export default router;
