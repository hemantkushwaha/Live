import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { createSuccessResponse } from '../../shared/helpers/response';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { securityService } from '../services/SecurityService';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  public static login(req: Request, res: Response, next: NextFunction): void {
    try {
      const { email, role } = req.body || {};
      const sanitizedEmail = securityService.sanitizeText(email || '');
      const clientIp = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const authData = AuthService.login(sanitizedEmail, role, clientIp, userAgent);
      res.status(200).json(createSuccessResponse(authData, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/register
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, role } = req.body || {};
      const sanitizedEmail = securityService.sanitizeText(email || '');
      const user = await AuthService.registerWithPassword(sanitizedEmail, password, role);
      res.status(201).json(createSuccessResponse(user, 'User registered successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  public static refresh(req: Request, res: Response, next: NextFunction): void {
    try {
      const { refreshToken } = req.body || {};
      const clientIp = req.ip || req.socket.remoteAddress;
      const tokens = AuthService.refreshToken(refreshToken, clientIp);
      res.status(200).json(createSuccessResponse(tokens, 'Tokens refreshed successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  public static me(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      if (req.user) {
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
      const clientIp = req.ip || req.socket.remoteAddress;
      if (token) {
        AuthService.logout(token, clientIp);
      }
      res.status(200).json(createSuccessResponse(undefined, 'Logged out successfully'));
    } catch (error) {
      next(error);
    }
  }
}
