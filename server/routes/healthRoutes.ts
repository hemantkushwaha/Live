import { Router, Request, Response } from 'express';
import { createSuccessResponse } from '../../shared/helpers/response';

const router = Router();

const handleHealth = (req: Request, res: Response) => {
  res.status(200).json(createSuccessResponse(undefined, 'Server running'));
};

/**
 * Health check endpoints
 */
router.get('/health', handleHealth);
router.get('/v1/health', handleHealth);
router.get('/api/v1/health', handleHealth);

export default router;
