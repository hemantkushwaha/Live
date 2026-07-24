import { CorsOptions } from 'cors';
import { SHARED_CONFIG } from '../../shared/config/config';
import { ENV } from './env';

const corsOptions: CorsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export const SERVER_CONFIG = {
  ...SHARED_CONFIG,
  env: ENV,
  cors: corsOptions,
};

export type ServerConfig = typeof SERVER_CONFIG;
