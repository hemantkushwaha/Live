import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { createSuccessResponse } from '../../shared/helpers/response';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  public static login(req: Request, res: Response, next: NextFunction): void {
    try {
      const { email } = req.body || {};
      const sessionData = AuthService.login(email);
      res.status(200).json(createSuccessResponse(sessionData, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  public static me(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      if (req.user && req.token) {
        res.status(200).json(
          createSuccessResponse(
            {
              user: req.user,
              token: req.token,
            },
            'Active user session retrieved'
          )
        );
        return;
      }

      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.headers['x-session-token'] as string);
      const session = AuthService.getSession(token);

      res.status(200).json(
        createSuccessResponse(
          {
            user: session.user,
            token: session.token,
            loginTimestamp: session.loginTimestamp,
          },
          'Active user session retrieved'
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  public static logout(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      const token = req.token || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.headers['x-session-token'] as string));
      if (token) {
        AuthService.logout(token);
      }
      res.status(200).json(createSuccessResponse(undefined, 'Logged out successfully'));
    } catch (error) {
      next(error);
    }
  }
}
