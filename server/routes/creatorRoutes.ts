import { Router } from 'express';
import { creatorController } from '../controllers/creatorController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// GET /api/v1/creators
router.get('/creators', optionalAuthMiddleware, (req, res) => creatorController.getCreators(req, res));
router.get('/', optionalAuthMiddleware, (req, res) => creatorController.getCreators(req, res));

// GET /api/v1/creator/:id
router.get('/:id', optionalAuthMiddleware, (req, res) => creatorController.getCreatorById(req, res));

// PUT /api/v1/creator/profile
router.put('/profile', authMiddleware, (req, res) => creatorController.updateProfile(req, res));

export default router;
