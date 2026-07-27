import { Router } from 'express';
import multer from 'multer';
import { mediaController } from '../controllers/mediaController';
import { authMiddleware } from '../middleware/authMiddleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

const router = Router();

// REST API Endpoints according to EWO-023
router.post('/upload', authMiddleware, upload.single('file'), mediaController.uploadMedia);
router.get('/:id', mediaController.getMedia);
router.delete('/:id', authMiddleware, mediaController.deleteMedia);

export default router;
