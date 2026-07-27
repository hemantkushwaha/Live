import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

import { SERVER_CONFIG } from './config/config';
import { requestIdMiddleware } from './middleware/requestId';
import { requestLoggerMiddleware } from './middleware/requestLogger';
import { notFoundMiddleware } from './middleware/notFound';
import { errorHandlerMiddleware } from './middleware/errorHandler';
import { rateLimitService } from './services/RateLimitService';
import apiRouter from './routes/index';
import healthRoutes from './routes/healthRoutes';
import { Logger } from './utils/logger';

export async function createApp(): Promise<Express> {
  const app = express();

  // 1. Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled CSP restriction for Vite HMR & preview iframe flexibility
      crossOriginEmbedderPolicy: false,
      frameguard: { action: 'sameorigin' },
    })
  );

  // Additional Security Headers (HSTS, NoSniff, Referrer Policy)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // 2. Core Request Middlewares, Compression & Body Size Limits
  app.use(compression());
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(cors(SERVER_CONFIG.cors));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // 3. General API Rate Limiter on /api routes
  app.use('/api', rateLimitService.generalApiLimiter());

  // 4. Mount API Routers
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);
  app.use('/', healthRoutes);

  // Frontend Integration (Vite Dev Middleware / Production Static)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    Logger.info('App', 'Vite development middleware attached');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
    Logger.info('App', 'Static production files served from /dist');
  }

  // Catch-all 404 for unmatched API routes
  app.use('/api/*', notFoundMiddleware);

  // Global API Error Handler Middleware
  app.use(errorHandlerMiddleware);

  return app;
}
