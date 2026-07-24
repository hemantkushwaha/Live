import { Router } from 'express';
import { creatorEconomyController } from '../controllers/creatorEconomyController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public / open routes
router.get('/gifts/available', (req, res) => creatorEconomyController.getAvailableGifts(req, res));
router.get('/settings/:creatorId', (req, res) => creatorEconomyController.getSettings(req, res));
router.get('/stream/:streamId/tips-gifts', (req, res) => creatorEconomyController.getStreamTipsGifts(req, res));

// Authenticated routes
router.use(authMiddleware);

router.get('/wallet', (req, res) => creatorEconomyController.getWallet(req, res));
router.post('/wallet/topup', (req, res) => creatorEconomyController.topUpWallet(req, res));
router.put('/settings', (req, res) => creatorEconomyController.updateSettings(req, res));
router.post('/tip', (req, res) => creatorEconomyController.sendTip(req, res));
router.post('/gift', (req, res) => creatorEconomyController.sendGift(req, res));
router.get('/stream/:streamId/check-requirements', (req, res) => creatorEconomyController.checkRequirements(req, res));

export default router;
