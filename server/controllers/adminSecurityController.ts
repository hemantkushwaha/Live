import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { auditService } from '../services/AuditService';
import { createSuccessResponse } from '../../shared/helpers/response';

export class AdminSecurityController {
  /**
   * GET /api/v1/admin/audit-logs
   */
  public getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const { userId, eventType, startDate, endDate, limit, offset } = req.query || {};

      const filters = {
        userId: userId ? String(userId) : undefined,
        eventType: eventType ? (String(eventType) as any) : undefined,
        startDate: startDate ? Number(startDate) : undefined,
        endDate: endDate ? Number(endDate) : undefined,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
      };

      const result = auditService.getLogs(filters);

      res.status(200).json(
        createSuccessResponse(result, 'Audit logs retrieved successfully.')
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/audit-integrity
   */
  public verifyAuditIntegrity(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const result = auditService.verifyAuditIntegrity();
      res.status(200).json(
        createSuccessResponse(result, 'Audit log integrity verification complete.')
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/security-summary
   */
  public getSecuritySummary(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const summary = auditService.getAuditSummary();
      const integrity = auditService.verifyAuditIntegrity();

      res.status(200).json(
        createSuccessResponse(
          {
            ...summary,
            integrity,
            hardenedFeatures: [
              'JWT Token Rotation & Revocation',
              'Argon2/Bcrypt Password Hashing',
              'Role-Based Access Control (RBAC)',
              'Helmet & Security Headers (HSTS, CSP, X-Frame-Options)',
              'Socket.io JWT Authentication',
              'Rate Limiting & Anti-Brute-Force',
              'Input Sanitization & XSS Prevention',
              'Payment Signature Verification & Idempotency',
              'Media Upload Type & Size Filtering',
              'Immutable Cryptographic Audit Logging',
            ],
          },
          'Security summary retrieved.'
        )
      );
    } catch (err) {
      next(err);
    }
  }
}

export const adminSecurityController = new AdminSecurityController();
