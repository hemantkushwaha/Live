import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'] as string;
  const requestId = existingId || crypto.randomUUID();

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
}
