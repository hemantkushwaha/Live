import dotenv from 'dotenv';
import path from 'path';
import { validateEnv, EnvConfig } from '../../shared/config/env';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const rawEnv: Record<string, string | undefined> = {
  PORT: process.env.PORT || '3000',
  CLIENT_URL: process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:3000',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
  JWT_SECRET: process.env.JWT_SECRET || 'liveconnect-default-jwt-secret-key-2026',
  STUN_SERVER: process.env.STUN_SERVER || 'stun:stun.l.google.com:19302',
  TURN_SERVER: process.env.TURN_SERVER || 'turn:global.turn.twilio.com:3478',
};

export const ENV: EnvConfig = validateEnv(rawEnv);
