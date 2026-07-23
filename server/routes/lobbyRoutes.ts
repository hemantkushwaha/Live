import { Router } from 'express';
import { LobbyController } from '../controllers/lobbyController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/users/online', authenticateToken, LobbyController.getOnlineUsers);
router.get('/streams/active', authenticateToken, LobbyController.getActiveStreams);

export default router;
