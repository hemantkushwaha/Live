import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { ENV } from './server/config/env';
import { createApp } from './server/app';
import { socketServerOptions } from './server/config/socket';
import { initSocketServer } from './server/socket/socketHandler';
import { jobScheduler } from './server/services/jobScheduler';
import { Logger } from './server/utils/logger';

async function startServer() {
  // Initialize Express Application
  const app = await createApp();

  // Start Background Job Scheduler (Presence, Expirations, Cache, Analytics Queue)
  jobScheduler.start();

  // Create HTTP Server
  const server = http.createServer(app);

  // Initialize Socket.io Server Foundation
  const io = new SocketIOServer(server, socketServerOptions);
  initSocketServer(io);

  // Bind to 0.0.0.0:3000
  server.listen(ENV.PORT, '0.0.0.0', () => {
    Logger.info('Server', `LiveConnect Server running at http://0.0.0.0:${ENV.PORT}`);
  });
}

startServer().catch((err) => {
  Logger.error('Server', 'Fatal error during server startup', err);
});
