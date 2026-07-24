import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { SERVER_CONFIG } from './config/config';
import { requestIdMiddleware } from './middleware/requestId';
import { requestLoggerMiddleware } from './middleware/requestLogger';
import { notFoundMiddleware } from './middleware/notFound';
import { errorHandlerMiddleware } from './middleware/errorHandler';
import apiRouter from './routes/index';
import healthRoutes from './routes/healthRoutes';
import { Logger } from './utils/logger';

export async function createApp(): Promise<Express> {
  const app = express();

  // Core Request & Security Middlewares
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(cors(SERVER_CONFIG.cors));
  app.use(express.json());

  // Mount API Routers
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);
  app.use('/', healthRoutes);

  // Catch-all 404 for unmatched API routes
  app.use(notFoundMiddleware);

  // Global API Error Handler Middleware
  app.use(errorHandlerMiddleware);

  // Frontend Integration (Vite Dev Middleware / Production Static)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    Logger.info('App', 'Vite development middleware attached');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    Logger.info('App', 'Static production files served from /dist');
  }

  return app;
}
