import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { rateLimitService } from '../services/RateLimitService';

const router = Router();

const authLimiter = rateLimitService.authLimiter();

router.post('/login', authLimiter, AuthController.login);
router.post('/register', authLimiter, (req, res, next) => AuthController.register(req, res, next));
router.post('/refresh', authLimiter, AuthController.refresh);
router.get('/me', authMiddleware, AuthController.me);
router.post('/logout', authMiddleware, AuthController.logout);

export default router;
