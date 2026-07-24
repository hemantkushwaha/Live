import { Router } from 'express';
import healthRoutes from './healthRoutes';

const apiRouter = Router();

// Mount health routes under /api/v1 and base routes
apiRouter.use('/v1', healthRoutes);
apiRouter.use('/', healthRoutes);

export default apiRouter;
