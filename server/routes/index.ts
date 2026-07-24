import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import lobbyRoutes from './lobbyRoutes';
import streamRoutes from './streamRoutes';
import signalingRoutes from './signalingRoutes';
import privateRequestRoutes from './privateRequestRoutes';
import creatorEconomyRoutes from './creatorEconomyRoutes';
import walletRoutes from './walletRoutes';
import giftRoutes from './giftRoutes';
import tipRoutes from './tipRoutes';
import creatorDashboardRoutes from './creatorDashboardRoutes';

const apiRouter = Router();

// Mount auth, lobby, streams, signaling, private requests, economy, wallet, gifts, tips, creator dashboard and health routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/v1/auth', authRoutes);
apiRouter.use('/lobby', lobbyRoutes);
apiRouter.use('/v1/lobby', lobbyRoutes);
apiRouter.use('/streams', streamRoutes);
apiRouter.use('/v1/streams', streamRoutes);
apiRouter.use('/signaling', signalingRoutes);
apiRouter.use('/v1/signaling', signalingRoutes);
apiRouter.use('/private', privateRequestRoutes);
apiRouter.use('/v1/private', privateRequestRoutes);
apiRouter.use('/economy', creatorEconomyRoutes);
apiRouter.use('/v1/economy', creatorEconomyRoutes);
apiRouter.use('/creator', creatorDashboardRoutes);
apiRouter.use('/v1/creator', creatorDashboardRoutes);
apiRouter.use('/wallet', walletRoutes);
apiRouter.use('/v1/wallet', walletRoutes);
apiRouter.use('/gifts', giftRoutes);
apiRouter.use('/v1/gifts', giftRoutes);
apiRouter.use('/tips', tipRoutes);
apiRouter.use('/v1/tips', tipRoutes);
apiRouter.use('/v1', healthRoutes);
apiRouter.use('/', healthRoutes);

export default apiRouter;
