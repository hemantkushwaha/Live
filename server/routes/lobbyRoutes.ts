import { Router } from 'express';
import { LobbyController } from '../controllers/lobbyController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/users/online', authenticateToken, LobbyController.getOnlineUsers);
router.get('/streams/active', authenticateToken, LobbyController.getActiveStreams);
router.get('/streams', authenticateToken, LobbyController.getActiveStreams);
router.get('/streams/:roomId', authenticateToken, LobbyController.getStreamById);

export default router;
