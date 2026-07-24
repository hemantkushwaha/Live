import { Router } from 'express';
import { walletController } from '../controllers/walletController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => walletController.getWallet(req, res));
router.get('/history', (req, res) => walletController.getHistory(req, res));
router.post('/demo-recharge', (req, res) => walletController.demoRecharge(req, res));

export default router;
