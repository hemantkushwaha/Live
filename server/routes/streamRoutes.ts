import { Router } from 'express';
import { streamController } from '../controllers/streamController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// REST API Endpoints for Public Live Streaming
router.get('/', (req, res) => streamController.getStreams(req, res));
router.post('/start', authMiddleware, (req, res) => streamController.startStream(req, res));
router.post('/end', authMiddleware, (req, res) => streamController.endStream(req, res));

export default router;
