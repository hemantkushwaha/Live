import { Router } from 'express';
import { privateRequestController } from '../controllers/privateRequestController';
import { privateSessionController } from '../controllers/privateSessionController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all private request endpoints
router.use(authMiddleware);

// Creator Settings Endpoints
router.get('/settings', (req, res) => privateRequestController.getSettings(req, res));
router.put('/settings', (req, res) => privateRequestController.updateSettings(req, res));

// Session & Billing Endpoints
router.get('/session/:id/summary', (req, res) => privateSessionController.getSessionSummary(req, res));
router.get('/session/:id', (req, res) => privateSessionController.getSession(req, res));

// Request Endpoints
router.post('/request', (req, res) => privateRequestController.createRequest(req, res));
router.post('/', (req, res) => privateRequestController.createRequest(req, res));

router.post('/request/:id/accept', (req, res) => privateRequestController.acceptRequest(req, res));
router.post('/:id/accept', (req, res) => privateRequestController.acceptRequest(req, res));

router.post('/request/:id/reject', (req, res) => privateRequestController.rejectRequest(req, res));
router.post('/:id/reject', (req, res) => privateRequestController.rejectRequest(req, res));

router.delete('/request/:id', (req, res) => privateRequestController.cancelRequest(req, res));
router.delete('/:id', (req, res) => privateRequestController.cancelRequest(req, res));

router.get('/requests', (req, res) => privateRequestController.getRequests(req, res));
router.get('/', (req, res) => privateRequestController.getRequests(req, res));

export default router;
