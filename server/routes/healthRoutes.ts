import { Router, Request, Response } from 'express';
import { createSuccessResponse } from '../../shared/helpers/response';

const router = Router();

/**
 * GET /api/v1/health
 * Health check endpoint for LiveConnect backend server
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json(createSuccessResponse(undefined, 'Server running'));
});

export default router;
