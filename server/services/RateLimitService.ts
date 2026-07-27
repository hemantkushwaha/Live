import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number;      // Max allowed requests per window
  message?: string; // Custom error message
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class RateLimitService {
  private static instance: RateLimitService;

  // In-memory sliding window counters (Key -> RateLimitRecord)
  private limits: Map<string, RateLimitRecord> = new Map();

  private constructor() {
    // Clean up expired keys every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.limits.entries()) {
        if (now > record.resetTime) {
          this.limits.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  public static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  /**
   * Check and increment rate limit counter for a specific key
   */
  public isRateLimited(key: string, options: RateLimitOptions): { limited: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    let record = this.limits.get(key);

    if (!record || now > record.resetTime) {
      // Initialize or reset window
      record = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      this.limits.set(key, record);
      return { limited: false, remaining: options.max - 1, resetTime: record.resetTime };
    }

    record.count++;

    if (record.count > options.max) {
      return { limited: true, remaining: 0, resetTime: record.resetTime };
    }

    return { limited: false, remaining: options.max - record.count, resetTime: record.resetTime };
  }

  /**
   * Middleware generator for rate limiting Express endpoints
   */
  public createMiddleware(prefix: string, options: RateLimitOptions) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown_ip';
      const userId = (req as any).user?.id || 'anonymous';
      const key = `ratelimit:${prefix}:${clientIp}:${userId}`;

      const { limited, remaining, resetTime } = this.isRateLimited(key, options);

      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

      if (limited) {
        Logger.warn('RateLimitService', `Rate limit exceeded for key: ${key}`);
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: options.message || 'Too many requests. Please try again later.',
            retryAfterSeconds: Math.ceil((resetTime - Date.now()) / 1000),
          },
        });
        return;
      }

      next();
    };
  }

  // Pre-configured rate limiters
  public authLimiter = () =>
    this.createMiddleware('auth', {
      windowMs: 60 * 1000, // 1 minute
      max: 10,              // 10 requests / min
      message: 'Too many authentication attempts. Please wait 1 minute before retrying.',
    });

  public paymentLimiter = () =>
    this.createMiddleware('payment', {
      windowMs: 60 * 1000, // 1 minute
      max: 15,             // 15 requests / min
      message: 'Payment API rate limit reached. Please wait a moment.',
    });

  public generalApiLimiter = () =>
    this.createMiddleware('api', {
      windowMs: 60 * 1000, // 1 minute
      max: 120,            // 120 requests / min
      message: 'API rate limit exceeded. Slow down requests.',
    });

  public adminLimiter = () =>
    this.createMiddleware('admin', {
      windowMs: 60 * 1000, // 1 minute
      max: 30,             // 30 requests / min
      message: 'Admin endpoint rate limit exceeded.',
    });
}

export const rateLimitService = RateLimitService.getInstance();
