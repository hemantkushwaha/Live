import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/errors';
import { createErrorResponse } from '../../shared/helpers/response';
import { Logger } from '../utils/logger';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (err instanceof AppError && err.statusCode < 500) {
    Logger.info('API', `Client Request [${req.method} ${req.originalUrl || req.url}] (${err.statusCode}): ${err.message}`);
    res.status(err.statusCode).json(createErrorResponse(err.errorCode, err.message, err.details));
    return;
  }

  Logger.error('API', `Request Error [${req.method} ${req.originalUrl || req.url}]: ${err.message}`, err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json(createErrorResponse(err.errorCode, err.message, err.details));
    return;
  }

  res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred'));
}
