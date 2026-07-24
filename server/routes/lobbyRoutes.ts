import { Router } from 'express';
import { LobbyController } from '../controllers/lobbyController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, LobbyController.getLobbyData);

export default router;
