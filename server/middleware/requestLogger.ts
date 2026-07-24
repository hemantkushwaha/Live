import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || 'no-id';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    Logger.info(
      'HTTP',
      `[${req.method}] ${req.originalUrl || req.url} ${statusCode} - ${duration}ms (reqId: ${requestId})`
    );
  });

  next();
}
