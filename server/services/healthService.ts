import { APP_NAME, APP_VERSION } from '../../shared/constants/constants';
import { monitoringService, SystemHealthReport } from './MonitoringService';

export interface ExtendedHealthStatusData {
  appName: string;
  version: string;
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  report?: SystemHealthReport;
}

export class HealthService {
  /**
   * Complete health status check (/api/v1/health)
   */
  public static getHealthStatus(): ExtendedHealthStatusData {
    const report = monitoringService.getHealthReport();
    return {
      appName: APP_NAME,
      version: APP_VERSION,
      status: report.overallStatus === 'HEALTHY' ? 'ok' : report.overallStatus === 'DEGRADED' ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      report,
    };
  }

  /**
   * Container readiness probe check (/api/v1/ready)
   * Ensures backend database and sub-services are operational before receiving traffic
   */
  public static getReadinessStatus(): { ready: boolean; timestamp: string; checks: Record<string, boolean> } {
    const report = monitoringService.getHealthReport();
    const checks = {
      database: report.subsystems.postgresql.status === 'HEALTHY',
      redis: report.subsystems.redis.status === 'HEALTHY',
      livekitSFU: report.subsystems.livekitSFU.status === 'HEALTHY',
      cloudinaryCDN: report.subsystems.cloudinaryCDN.status === 'HEALTHY',
    };

    const ready = Object.values(checks).every((status) => status === true);

    return {
      ready,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  /**
   * Lightweight container liveness probe check (/api/v1/live)
   * Fast sub-10ms response to verify event loop responsiveness
   */
  public static getLivenessStatus(): { alive: boolean; timestamp: string; pid: number } {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      pid: process.pid,
    };
  }
}
