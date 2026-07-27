import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../services/MonitoringService';
import { loggingService, LogCategory, LogLevel } from '../services/LoggingService';
import { operationsService } from '../services/OperationsService';
import { createSuccessResponse } from '../../shared/helpers/response';

export class OpsController {
  /**
   * GET /api/v1/admin/ops/metrics (Datadog & APM JSON format)
   */
  public getMetrics(req: Request, res: Response, next: NextFunction): void {
    try {
      const datadogMetrics = monitoringService.getDatadogFormattedMetrics();
      res.status(200).json(
        createSuccessResponse(datadogMetrics, 'Datadog & APM monitoring metrics retrieved.')
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/ops/alerts
   */
  public getAlerts(req: Request, res: Response, next: NextFunction): void {
    try {
      const activeAlerts = monitoringService.getActiveAlerts();
      const alertHistory = monitoringService.getAlertHistory();
      res.status(200).json(
        createSuccessResponse({ activeAlerts, alertHistory }, 'Active & historical alerts retrieved.')
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/ops/logs
   */
  public getLogs(req: Request, res: Response, next: NextFunction): void {
    try {
      const { category, level, search, limit, offset } = req.query || {};

      const result = loggingService.queryLogs({
        category: category ? (String(category) as LogCategory) : undefined,
        level: level ? (String(level) as LogLevel) : undefined,
        search: search ? String(search) : undefined,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
      });

      res.status(200).json(
        createSuccessResponse(result, 'Structured log entries retrieved successfully.')
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/ops/backups
   */
  public getBackups(req: Request, res: Response, next: NextFunction): void {
    try {
      const backups = operationsService.getBackupStatus();
      res.status(200).json(
        createSuccessResponse(backups, 'Database and media backup status retrieved.')
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/ops/backups/trigger
   */
  public triggerBackup(req: Request, res: Response, next: NextFunction): void {
    try {
      const { service = 'postgresql' } = req.body || {};
      const backup = operationsService.triggerManualBackup(service);
      res.status(200).json(
        createSuccessResponse(backup, `Manual backup completed for ${service}.`)
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/ops/ci-status
   */
  public getCICDStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      const ciStatus = operationsService.getCICDPipelineStatus();
      res.status(200).json(
        createSuccessResponse(ciStatus, 'CI/CD deployment pipeline status retrieved.')
      );
    } catch (err) {
      next(err);
    }
  }
}

export const opsController = new OpsController();
