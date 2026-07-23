import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';

import { ENV } from './server/config/env';
import { Logger } from './server/utils/logger';
import authRoutes from './server/routes/authRoutes';
import lobbyRoutes from './server/routes/lobbyRoutes';
import { initSocketServer } from './server/socket/socketHandler';

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Configure Socket.io with CORS
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Basic Middlewares
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/lobby', lobbyRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'LiveConnect Server', time: new Date().toISOString() });
  });

  // Initialize Socket.io Connection Logic
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

  // Bind exclusively to 0.0.0.0:3000 as required
  server.listen(ENV.PORT, '0.0.0.0', () => {
    Logger.info('Server', `LiveConnect Server running at http://0.0.0.0:${ENV.PORT}`);
  });
}

startServer().catch((err) => {
  Logger.error('Server', 'Fatal error during server startup', err);
});
