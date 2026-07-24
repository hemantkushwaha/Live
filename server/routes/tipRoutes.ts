import { Router } from 'express';
import { giftController } from '../controllers/giftController';
import { authMiddleware } from '../middleware/authMiddleware';

const tipRouter = Router();

tipRouter.use(authMiddleware);

// POST /api/v1/tips/send
tipRouter.post('/send', (req, res) => giftController.sendTip(req, res));

export default tipRouter;
