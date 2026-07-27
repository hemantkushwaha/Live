import { Router } from 'express';
import { liveKitController } from '../controllers/livekitController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// LiveKit SFU REST API Routes (EWO-026)
router.post('/token', optionalAuthMiddleware, (req, res) => liveKitController.generateToken(req, res));
router.post('/room', authMiddleware, (req, res) => liveKitController.createRoom(req, res));
router.delete('/room/:id', authMiddleware, (req, res) => liveKitController.deleteRoom(req, res));

// Additional management routes
router.get('/rooms', (req, res) => liveKitController.getRooms(req, res));
router.get('/room/:id/participants', (req, res) => liveKitController.getParticipants(req, res));

export default router;
