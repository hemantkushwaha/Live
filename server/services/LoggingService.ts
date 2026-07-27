import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger';

export type LogCategory = 'application' | 'security' | 'payment' | 'streaming' | 'audit';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface StructuredLogEntry {
  id: string;
  timestamp: string;
  epochMs: number;
  category: LogCategory;
  level: LogLevel;
  scope: string;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  requestId?: string;
  traceId?: string;
}

export class LoggingService {
  private static instance: LoggingService;

  // In-memory ring buffer for recent structured logs (max 2000 entries)
  private logRingBuffer: StructuredLogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 2000;

  // Category specific counters
  private categoryCounts: Record<LogCategory, number> = {
    application: 0,
    security: 0,
    payment: 0,
    streaming: 0,
    audit: 0,
  };

  private constructor() {}

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Log a structured event with explicit category categorization
   */
  public log(
    category: LogCategory,
    level: LogLevel,
    scope: string,
    message: string,
    details?: Record<string, any>,
    context: { userId?: string; ipAddress?: string; requestId?: string } = {}
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      id: `log_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      epochMs: Date.now(),
      category,
      level,
      scope,
      message,
      details,
      userId: context.userId,
      ipAddress: context.ipAddress,
      requestId: context.requestId,
      traceId: `trace_${Math.random().toString(36).substring(2, 8)}`,
    };

    // Increment category counter
    this.categoryCounts[category] = (this.categoryCounts[category] || 0) + 1;

    // Buffer management
    this.logRingBuffer.push(entry);
    if (this.logRingBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logRingBuffer.shift();
    }

    // Console output for stdout collectors (Datadog / CloudWatch / Cloud Run)
    const jsonStr = JSON.stringify(entry);
    if (level === 'ERROR') {
      Logger.error(scope, `[${category.toUpperCase()}] ${message}`, jsonStr);
    } else if (level === 'WARN') {
      Logger.warn(scope, `[${category.toUpperCase()}] ${message}`, jsonStr);
    } else {
      Logger.info(scope, `[${category.toUpperCase()}] ${message}`);
    }

    return entry;
  }

  // Helper shortcuts for specific categories
  public logApp(level: LogLevel, scope: string, msg: string, details?: Record<string, any>, ctx?: any) {
    return this.log('application', level, scope, msg, details, ctx);
  }

  public logSecurity(level: LogLevel, scope: string, msg: string, details?: Record<string, any>, ctx?: any) {
    return this.log('security', level, scope, msg, details, ctx);
  }

  public logPayment(level: LogLevel, scope: string, msg: string, details?: Record<string, any>, ctx?: any) {
    return this.log('payment', level, scope, msg, details, ctx);
  }

  public logStreaming(level: LogLevel, scope: string, msg: string, details?: Record<string, any>, ctx?: any) {
    return this.log('streaming', level, scope, msg, details, ctx);
  }

  public logAudit(level: LogLevel, scope: string, msg: string, details?: Record<string, any>, ctx?: any) {
    return this.log('audit', level, scope, msg, details, ctx);
  }

  /**
   * Query structured logs by category, level, or search phrase
   */
  public queryLogs(filters: {
    category?: LogCategory;
    level?: LogLevel;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): { total: number; logs: StructuredLogEntry[]; summary: Record<LogCategory, number> } {
    let result = [...this.logRingBuffer];

    if (filters.category) {
      result = result.filter((item) => item.category === filters.category);
    }

    if (filters.level) {
      result = result.filter((item) => item.level === filters.level);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.message.toLowerCase().includes(q) ||
          item.scope.toLowerCase().includes(q) ||
          JSON.stringify(item.details || {}).toLowerCase().includes(q)
      );
    }

    // Sort descending by timestamp
    result.sort((a, b) => b.epochMs - a.epochMs);

    const total = result.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;

    return {
      total,
      logs: result.slice(offset, offset + limit),
      summary: this.categoryCounts,
    };
  }
}

export const loggingService = LoggingService.getInstance();
