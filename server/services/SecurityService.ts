import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { Logger } from '../utils/logger';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  tokenId?: string;
  [key: string]: any;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export class SecurityService {
  private static instance: SecurityService;

  // Revoked tokens store (In-memory token blacklist for immediate token revocation)
  private revokedTokens: Set<string> = new Set();
  
  // Idempotency store for payment replay prevention (key -> timestamp)
  private idempotencyStore: Map<string, number> = new Map();

  // Allowed file MIME types and dangerous extensions for file upload security
  private readonly ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'application/pdf',
  ]);

  private readonly DANGEROUS_EXTENSIONS = new Set([
    '.exe', '.sh', '.php', '.bat', '.cmd', '.js', '.py', '.pl',
    '.dll', '.so', '.vbs', '.ps1', '.cgi', '.com', '.scr', '.pif',
  ]);

  private constructor() {
    // Periodically clean up expired idempotency keys (every hour)
    setInterval(() => {
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000; // 24 hours
      for (const [key, timestamp] of this.idempotencyStore.entries()) {
        if (now - timestamp > ttl) {
          this.idempotencyStore.delete(key);
        }
      }
    }, 60 * 60 * 1000);
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // ==========================================
  // PASSWORDS (Bcrypt hashing)
  // ==========================================

  public async hashPassword(plaintext: string): Promise<string> {
    if (!plaintext || typeof plaintext !== 'string') {
      throw new Error('Plaintext password must be a non-empty string.');
    }
    const saltRounds = 12;
    return await bcrypt.hash(plaintext, saltRounds);
  }

  public async comparePassword(plaintext: string, hash: string): Promise<boolean> {
    if (!plaintext || !hash) return false;
    return await bcrypt.compare(plaintext, hash);
  }

  // ==========================================
  // JWT ACCESS & REFRESH TOKENS
  // ==========================================

  public generateAccessToken(payload: TokenPayload): string {
    const secret = ENV.JWT_SECRET || 'liveconnect-default-jwt-secret-key-2026';
    const tokenId = crypto.randomUUID();
    return jwt.sign(
      { ...payload, tokenId, type: 'access' },
      secret,
      { expiresIn: '15m' }
    );
  }

  public generateRefreshToken(payload: TokenPayload): string {
    const refreshSecret = ENV.JWT_REFRESH_SECRET || 'liveconnect-default-jwt-refresh-secret-key-2026';
    const tokenId = crypto.randomUUID();
    return jwt.sign(
      { userId: payload.userId, tokenId, type: 'refresh' },
      refreshSecret,
      { expiresIn: '7d' }
    );
  }

  public verifyAccessToken(token: string): TokenPayload {
    if (this.isTokenRevoked(token)) {
      throw new Error('Token has been revoked or invalidated.');
    }

    const secret = ENV.JWT_SECRET || 'liveconnect-default-jwt-secret-key-2026';
    const decoded = jwt.verify(token, secret) as TokenPayload & { type?: string };

    if (decoded.type && decoded.type !== 'access') {
      throw new Error('Invalid token type.');
    }

    return decoded;
  }

  public verifyRefreshToken(refreshToken: string): { userId: string; tokenId: string } {
    if (this.isTokenRevoked(refreshToken)) {
      throw new Error('Refresh token has been revoked.');
    }

    const refreshSecret = ENV.JWT_REFRESH_SECRET || 'liveconnect-default-jwt-refresh-secret-key-2026';
    const decoded = jwt.verify(refreshToken, refreshSecret) as { userId: string; tokenId: string; type?: string };

    if (decoded.type && decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token type.');
    }

    return decoded;
  }

  public revokeToken(token: string): void {
    if (token) {
      this.revokedTokens.add(token);
      Logger.info('SecurityService', `Token revoked: ${token.substring(0, 15)}...`);
    }
  }

  public isTokenRevoked(token: string): boolean {
    return this.revokedTokens.has(token);
  }

  // ==========================================
  // XSS & INPUT SANITIZATION
  // ==========================================

  public sanitizeText(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }

  public sanitizeObject<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return this.sanitizeText(obj) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized as unknown as T;
    }

    return obj;
  }

  // ==========================================
  // PAYMENTS & REPLAY PREVENTION
  // ==========================================

  public checkAndStoreIdempotencyKey(key: string): boolean {
    if (!key || typeof key !== 'string') return true;

    if (this.idempotencyStore.has(key)) {
      return false; // Key already processed -> Replay detected
    }

    this.idempotencyStore.set(key, Date.now());
    return true; // New valid request
  }

  public verifyPaymentSignature(provider: string, payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;

    try {
      if (provider === 'stripe') {
        const expectedSig = crypto
          .createHmac('sha256', secret)
          .update(payload, 'utf8')
          .digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
      } else if (provider === 'razorpay') {
        const expectedSig = crypto
          .createHmac('sha256', secret)
          .update(payload, 'utf8')
          .digest('hex');
        return expectedSig === signature;
      }

      // Default HMAC verification
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      return expected === signature;
    } catch (err) {
      Logger.error('SecurityService', `Payment signature verification failed for ${provider}`, err);
      return false;
    }
  }

  // ==========================================
  // MEDIA UPLOAD VALIDATION
  // ==========================================

  public validateFileUpload(file: { originalname: string; mimetype: string; size: number }): FileValidationResult {
    if (!file) {
      return { valid: false, error: 'No file provided.' };
    }

    // Check extension
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
    if (this.DANGEROUS_EXTENSIONS.has(ext)) {
      return { valid: false, error: `Executable or dangerous file extension '${ext}' rejected.` };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      return { valid: false, error: `MIME type '${file.mimetype}' is not permitted.` };
    }

    // Max file size: 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { valid: false, error: `File size exceeds maximum allowed limit of 50MB.` };
    }

    return { valid: true };
  }
}

export const securityService = SecurityService.getInstance();
