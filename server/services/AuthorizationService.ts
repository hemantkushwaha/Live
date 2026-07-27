import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuthorizationError } from '../../shared/errors/errors';
import { auditService } from './AuditService';
import { Logger } from '../utils/logger';

export type UserRole = 'viewer' | 'creator' | 'moderator' | 'admin' | 'super_admin';

export interface PermissionCheckOptions {
  requiredRole: UserRole;
  allowSelf?: boolean;
  resourceOwnerId?: string;
}

export class AuthorizationService {
  private static instance: AuthorizationService;

  // Role hierarchy score map
  private readonly ROLE_HIERARCHY: Record<UserRole, number> = {
    viewer: 1,
    creator: 2,
    moderator: 3,
    admin: 4,
    super_admin: 5,
  };

  private constructor() {}

  public static getInstance(): AuthorizationService {
    if (!AuthorizationService.instance) {
      AuthorizationService.instance = new AuthorizationService();
    }
    return AuthorizationService.instance;
  }

  /**
   * Normalize input role string to UserRole enum
   */
  public normalizeRole(role?: string): UserRole {
    if (!role) return 'viewer';
    const clean = role.toLowerCase().replace(/[\s_-]+/g, '_');
    if (clean === 'super_admin' || clean === 'superadmin') return 'super_admin';
    if (clean === 'admin') return 'admin';
    if (clean === 'moderator' || clean === 'mod') return 'moderator';
    if (clean === 'creator' || clean === 'host') return 'creator';
    return 'viewer';
  }

  /**
   * Check if user role satisfies required minimum role priority
   */
  public hasRole(userRole?: string, requiredRole: UserRole = 'viewer'): boolean {
    const normUserRole = this.normalizeRole(userRole);
    const normReqRole = this.normalizeRole(requiredRole);

    const userPriority = this.ROLE_HIERARCHY[normUserRole] || 1;
    const requiredPriority = this.ROLE_HIERARCHY[normReqRole] || 1;

    return userPriority >= requiredPriority;
  }

  /**
   * Check if user owns a resource or has admin privilege
   */
  public canAccessResource(userId?: string, resourceOwnerId?: string, userRole?: string): boolean {
    if (!userId) return false;
    if (resourceOwnerId && userId === resourceOwnerId) return true;
    return this.hasRole(userRole, 'admin');
  }

  /**
   * Express Middleware generator for enforcing minimum role requirements
   */
  public authorize(requiredRole: UserRole, options: { allowSelf?: boolean } = {}) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new AuthorizationError('Authentication required to access this resource.');
        }

        const userRole = this.normalizeRole(req.user.role);
        const resourceOwnerId = req.params.userId || req.params.id || req.body?.userId;

        let authorized = this.hasRole(userRole, requiredRole);

        if (!authorized && options.allowSelf && resourceOwnerId && req.user.id === resourceOwnerId) {
          authorized = true;
        }

        if (!authorized) {
          // Log unauthorized access attempt to Audit Log
          auditService.logEvent({
            eventType: 'ACCESS_DENIED',
            userId: req.user.id,
            userRole: userRole,
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            resource: req.originalUrl,
            action: req.method,
            details: `Required role ${requiredRole}, but user had role ${userRole}`,
            status: 'FAILURE',
          });

          Logger.warn('AuthorizationService', `Access denied for user ${req.user.id} (${userRole}) -> ${req.method} ${req.originalUrl}`);
          throw new AuthorizationError(`Insufficient permissions. Required role: ${requiredRole}`);
        }

        next();
      } catch (err) {
        next(err);
      }
    };
  }
}

export const authorizationService = AuthorizationService.getInstance();
