import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';
import { rateLimitService } from '../services/RateLimitService';

const router = Router();
const paymentLimiter = rateLimitService.paymentLimiter();

// Public / Optional Auth Coin Packages Endpoint
router.get('/coin-packages', (req, res) => paymentController.getCoinPackages(req, res));

// Protected Payment Endpoints with Rate Limiting & Signature Security
router.post('/order', paymentLimiter, authMiddleware, (req, res) => paymentController.createOrder(req, res));
router.post('/verify', paymentLimiter, authMiddleware, (req, res) => paymentController.verifyPayment(req, res));
router.get('/history', paymentLimiter, authMiddleware, (req, res) => paymentController.getPaymentHistory(req, res));
router.post('/refund', paymentLimiter, authMiddleware, (req, res) => paymentController.requestRefund(req, res));

export default router;
