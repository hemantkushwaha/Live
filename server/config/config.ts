import { CorsOptions } from 'cors';
import { SHARED_CONFIG } from '../../shared/config/config';
import { ENV } from './env';

const allowedOrigins = [
  ENV.CLIENT_URL,
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean) as string[];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      process.env.NODE_ENV !== 'production' ||
      origin === '*'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
};

export const SERVER_CONFIG = {
  ...SHARED_CONFIG,
  env: ENV,
  cors: corsOptions,
};

export type ServerConfig = typeof SERVER_CONFIG;
