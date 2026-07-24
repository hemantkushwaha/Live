import { APP_NAME, APP_VERSION } from '../../shared/constants/constants';

export interface HealthStatusData {
  appName: string;
  version: string;
  status: string;
  timestamp: string;
  uptime: number;
}

export class HealthService {
  /**
   * Generates health status information for the server.
   */
  public static getHealthStatus(): HealthStatusData {
    return {
      appName: APP_NAME,
      version: APP_VERSION,
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
