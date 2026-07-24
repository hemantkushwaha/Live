import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../../shared/errors/errors';

export function notFoundMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Pass NotFoundError for API endpoints to error handler
  if (req.path.startsWith('/api')) {
    next(new NotFoundError(`API endpoint [${req.method} ${req.path}] not found`));
    return;
  }
  next();
}
