import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';

import { ENV } from './server/config/env';
import { SERVER_CONFIG } from './server/config/config';
import { socketServerOptions } from './server/config/socket';
import { errorHandlerMiddleware } from './server/config/api';
import { Logger } from './server/utils/logger';
import healthRoutes from './server/routes/healthRoutes';
import { initSocketServer } from './server/socket/socketHandler';

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Configure Socket.io with centralized socket options
  const io = new SocketIOServer(server, socketServerOptions);

  // Basic Middlewares
  app.use(cors(SERVER_CONFIG.cors));
  app.use(express.json());

  // API Routes (v1 and base health)
  app.use('/api/v1', healthRoutes);
  app.use('/api', healthRoutes);

  // Global API Error Middleware
  app.use(errorHandlerMiddleware);

  // Initialize Socket.io Server Foundation
  initSocketServer(io);

  // Development vs Production Frontend Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    Logger.info('Server', 'Vite development middleware attached');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    Logger.info('Server', 'Static production files served from /dist');
  }

  // Bind to 0.0.0.0:3000
  server.listen(ENV.PORT, '0.0.0.0', () => {
    Logger.info('Server', `LiveConnect Server running at http://0.0.0.0:${ENV.PORT}`);
  });
}

startServer().catch((err) => {
  Logger.error('Server', 'Fatal error during server startup', err);
});
