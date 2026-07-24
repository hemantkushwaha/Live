import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { createApp } from './server/app';
import { ENV } from './server/config/env';
import { socketServerOptions } from './server/config/socket';
import { initSocketServer } from './server/socket/socketHandler';
import { Logger } from './server/utils/logger';

async function startServer() {
  // Initialize Express Application
  const app = await createApp();

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
