import { Router } from 'express';
import { giftController } from '../controllers/giftController';
import { authMiddleware } from '../middleware/authMiddleware';

const giftRouter = Router();

giftRouter.use(authMiddleware);

// POST /api/v1/gifts/send
giftRouter.post('/send', (req, res) => giftController.sendGift(req, res));

// GET /api/v1/gifts/history
giftRouter.get('/history', (req, res) => giftController.getHistory(req, res));

export default giftRouter;
