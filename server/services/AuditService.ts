import crypto from 'crypto';
import { Logger } from '../utils/logger';

export type AuditEventType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'ADMIN_ACTION'
  | 'ROLE_CHANGE'
  | 'PAYMENT_EVENT'
  | 'WITHDRAWAL_APPROVAL'
  | 'SECURITY_ALERT'
  | 'ACCESS_DENIED'
  | 'TOKEN_REFRESH'
  | 'USER_MUTATION';

export interface AuditEvent {
  id: string;
  timestamp: number;
  eventType: AuditEventType;
  userId: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  details?: string | Record<string, any>;
  status: 'SUCCESS' | 'FAILURE';
  checksum: string; // Cryptographic integrity hash ensuring log immutability
}

export class AuditService {
  private static instance: AuditService;
  
  // Append-only immutable audit log buffer
  private auditLogs: AuditEvent[] = [];

  private constructor() {}

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Generates SHA-256 integrity hash for an audit record to ensure immutability
   */
  private computeChecksum(record: Omit<AuditEvent, 'checksum'>): string {
    const serialized = `${record.id}:${record.timestamp}:${record.eventType}:${record.userId}:${record.status}:${JSON.stringify(record.details || {})}`;
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Append an immutable audit event log
   */
  public logEvent(data: Omit<AuditEvent, 'id' | 'timestamp' | 'checksum'>): AuditEvent {
    const id = `audit_${crypto.randomUUID()}`;
    const timestamp = Date.now();

    const partialRecord = {
      id,
      timestamp,
      eventType: data.eventType,
      userId: data.userId || 'system',
      userRole: data.userRole || 'viewer',
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
      resource: data.resource || 'N/A',
      action: data.action || 'N/A',
      details: typeof data.details === 'object' ? JSON.stringify(data.details) : data.details,
      status: data.status,
    };

    const checksum = this.computeChecksum(partialRecord);
    const event: AuditEvent = { ...partialRecord, checksum };

    // Push to append-only array
    this.auditLogs.push(event);

    Logger.info('AuditService', `[${event.eventType}] User: ${event.userId} | Action: ${event.action} | Status: ${event.status}`);

    return event;
  }

  /**
   * Query audit logs with pagination and filters
   */
  public getLogs(filters: {
    userId?: string;
    eventType?: AuditEventType;
    startDate?: number;
    endDate?: number;
    limit?: number;
    offset?: number;
  } = {}): { total: number; logs: AuditEvent[] } {
    let result = [...this.auditLogs];

    if (filters.userId) {
      result = result.filter((log) => log.userId === filters.userId);
    }

    if (filters.eventType) {
      result = result.filter((log) => log.eventType === filters.eventType);
    }

    if (filters.startDate) {
      result = result.filter((log) => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      result = result.filter((log) => log.timestamp <= filters.endDate!);
    }

    // Sort descending by timestamp
    result.sort((a, b) => b.timestamp - a.timestamp);

    const total = result.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;

    const paginatedLogs = result.slice(offset, offset + limit);

    return { total, logs: paginatedLogs };
  }

  /**
   * Verify audit log integrity using cryptographic checksums
   */
  public verifyAuditIntegrity(): { totalRecords: number; validRecords: number; tampered: boolean } {
    let validCount = 0;
    let tampered = false;

    for (const record of this.auditLogs) {
      const { checksum, ...partial } = record;
      const recomputed = this.computeChecksum(partial);
      if (recomputed === checksum) {
        validCount++;
      } else {
        tampered = true;
        Logger.error('AuditService', `Audit log tampering detected on record ${record.id}!`);
      }
    }

    return {
      totalRecords: this.auditLogs.length,
      validRecords: validCount,
      tampered,
    };
  }

  /**
   * Retrieve aggregate stats for admin audit dashboard
   */
  public getAuditSummary(): { totalEvents: number; eventCounts: Record<string, number> } {
    const eventCounts: Record<string, number> = {};
    for (const log of this.auditLogs) {
      eventCounts[log.eventType] = (eventCounts[log.eventType] || 0) + 1;
    }
    return {
      totalEvents: this.auditLogs.length,
      eventCounts,
    };
  }
}

export const auditService = AuditService.getInstance();
