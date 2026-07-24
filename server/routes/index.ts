import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';

const apiRouter = Router();

// Mount auth and health routes under /api/v1 and base routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/v1/auth', authRoutes);
apiRouter.use('/v1', healthRoutes);
apiRouter.use('/', healthRoutes);

export default apiRouter;
