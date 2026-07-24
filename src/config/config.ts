import { SHARED_CONFIG } from '../../shared/config/config';

// Vite environment variables access
const env = (import.meta as unknown as { env: Record<string, string> }).env || {};

export const CLIENT_CONFIG = {
  ...SHARED_CONFIG,
  apiBaseUrl: env.VITE_API_BASE_URL || '/api/v1',
  socketUrl: env.VITE_SOCKET_URL || '/',
} as const;

export type ClientConfig = typeof CLIENT_CONFIG;
