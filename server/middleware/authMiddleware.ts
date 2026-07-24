import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticationError } from '../../shared/errors/errors';
import { User } from '../../shared/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers['x-session-token']) {
      token = req.headers['x-session-token'] as string;
    }

    if (!token) {
      throw new AuthenticationError('Authentication token missing');
    }

    const session = AuthService.getSession(token);
    req.user = session.user;
    req.token = session.token;
    next();
  } catch (error) {
    next(error);
  }
}
