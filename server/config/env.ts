import dotenv from 'dotenv';
import path from 'path';
import { validateEnv, EnvConfig } from '../../shared/config/env';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Sanitize CLOUDINARY_URL to prevent Cloudinary SDK from throwing on invalid URL
if (process.env.CLOUDINARY_URL) {
  const url = process.env.CLOUDINARY_URL;
  if (!url.startsWith('cloudinary://') || url.includes('api_key:api_secret')) {
    delete process.env.CLOUDINARY_URL;
  }
}

const rawEnv: Record<string, string | undefined> = {
  PORT: '3000',
  CLIENT_URL: process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:3000',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
  JWT_SECRET: process.env.JWT_SECRET || 'liveconnect-default-jwt-secret-key-2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'liveconnect-default-jwt-refresh-secret-key-2026',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/liveconnect',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  STUN_SERVER: process.env.STUN_SERVER || 'stun:stun.l.google.com:19302',
  TURN_SERVER: process.env.TURN_SERVER || 'turn:global.turn.twilio.com:3478',
  LIVEKIT_URL: process.env.LIVEKIT_URL || 'wss://livekit.example.com',
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY || 'devkey',
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET || 'secretkey',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
};

export const ENV: EnvConfig = validateEnv(rawEnv);
