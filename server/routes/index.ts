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
import creatorRoutes from './creatorRoutes';
import followRoutes from './followRoutes';
import discoveryRoutes from './discoveryRoutes';
import mediaRoutes from './mediaRoutes';
import paymentRoutes from './paymentRoutes';
import withdrawalRoutes from './withdrawalRoutes';
import livekitRoutes from './livekitRoutes';
import adminSecurityRoutes from './adminSecurityRoutes';
import performanceRoutes from './performanceRoutes';
import opsRoutes from './opsRoutes';
import { paymentController } from '../controllers/paymentController';

const apiRouter = Router();

// Mount auth, lobby, streams, signaling, private requests, economy, wallet, gifts, tips, creator dashboard, follow, discovery, payments and health routes
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
apiRouter.use('/creators', creatorRoutes);
apiRouter.use('/v1/creators', creatorRoutes);
apiRouter.use('/follow', followRoutes);
apiRouter.use('/v1/follow', followRoutes);
apiRouter.use('/discovery', discoveryRoutes);
apiRouter.use('/v1/discovery', discoveryRoutes);
apiRouter.use('/wallet', walletRoutes);
apiRouter.use('/v1/wallet', walletRoutes);
apiRouter.use('/gifts', giftRoutes);
apiRouter.use('/v1/gifts', giftRoutes);
apiRouter.use('/tips', tipRoutes);
apiRouter.use('/v1/tips', tipRoutes);
apiRouter.use('/media', mediaRoutes);
apiRouter.use('/v1/media', mediaRoutes);

// EWO-024 Payment Routes & Coin Packages
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/v1/payments', paymentRoutes);
apiRouter.get('/coin-packages', (req, res) => paymentController.getCoinPackages(req, res));
apiRouter.get('/v1/coin-packages', (req, res) => paymentController.getCoinPackages(req, res));

// EWO-027 Admin Security & Audit Log Routes
apiRouter.use('/admin', adminSecurityRoutes);
apiRouter.use('/v1/admin', adminSecurityRoutes);

// EWO-029 Operations, Monitoring & Alerting Routes
apiRouter.use('/admin/ops', opsRoutes);
apiRouter.use('/v1/admin/ops', opsRoutes);

// EWO-028 Performance Optimization & Benchmark Routes
apiRouter.use('/performance', performanceRoutes);
apiRouter.use('/v1/performance', performanceRoutes);

// EWO-026 LiveKit SFU Migration Routes
apiRouter.use('/livekit', livekitRoutes);
apiRouter.use('/v1/livekit', livekitRoutes);

// EWO-025 Creator Withdrawals & Financial Ledger Routes
apiRouter.use('/', withdrawalRoutes);
apiRouter.use('/v1', withdrawalRoutes);

apiRouter.use('/v1', healthRoutes);
apiRouter.use('/', healthRoutes);

export default apiRouter;
