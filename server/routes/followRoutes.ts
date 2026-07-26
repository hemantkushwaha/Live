import { Router } from 'express';
import { followController } from '../controllers/followController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// POST /api/v1/follow
router.post('/', authMiddleware, (req, res) => followController.followCreator(req, res));

// DELETE /api/v1/follow
router.delete('/', authMiddleware, (req, res) => followController.unfollowCreator(req, res));

// GET /api/v1/follow/followers/:creatorId
router.get('/followers/:creatorId', (req, res) => followController.getFollowers(req, res));

// GET /api/v1/follow/following/:followerId
router.get('/following/:followerId', (req, res) => followController.getFollowing(req, res));

export default router;
