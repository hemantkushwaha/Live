import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/v1/health
 * Health check endpoint for LiveConnect backend server
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
