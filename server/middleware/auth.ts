import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { sendError } from '../utils/response';
import { User } from '../../shared/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Authentication token missing', 'UNAUTHORIZED', 401);
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as User;
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 'FORBIDDEN', 403);
  }
}
