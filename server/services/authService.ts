import { ValidationError, AuthenticationError } from '../../shared/errors/errors';
import { User } from '../../shared/types';
import { sessionStore, SessionData } from '../store/sessionStore';
import { presenceService } from './presenceService';
import { broadcastPresenceUpdate } from '../socket/socketHandler';
import { securityService } from './SecurityService';
import { auditService } from './AuditService';
import { authorizationService, UserRole } from './AuthorizationService';

export interface AuthResponse extends SessionData {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  // In-memory user store for credentials if database not connected
  private static userDatabase: Map<string, { user: User; passwordHash: string }> = new Map();

  /**
   * Validates email format and creates session + JWT tokens
   */
  public static login(email: string, roleInput?: string, ipAddress?: string, userAgent?: string): AuthResponse {
    if (email === undefined || email === null || typeof email !== 'string') {
      throw new ValidationError('Email is required');
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail.length === 0) {
      throw new ValidationError('Email cannot be empty or whitespace only');
    }

    // Standard email format validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new ValidationError('Please enter a valid email address (e.g. user@example.com)');
    }

    // Derive role
    const derivedRole: UserRole = authorizationService.normalizeRole(
      roleInput || (trimmedEmail.includes('admin') ? 'admin' : trimmedEmail.includes('creator') ? 'creator' : 'viewer')
    );

    // Derive username from email prefix and generate unique User ID
    const emailPrefix = trimmedEmail.split('@')[0];
    const cleanUsername = emailPrefix.replace(/[^a-zA-Z0-9_]/g, '_') || 'user';
    const userId = `usr_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;

    const user: User = {
      id: userId,
      email: trimmedEmail.toLowerCase(),
      username: cleanUsername,
      role: derivedRole,
      status: 'idle',
      connectedAt: Date.now(),
    };

    const session = sessionStore.createSession(user);

    // Generate JWT Access and Refresh Tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role || 'viewer',
    };

    const accessToken = securityService.generateAccessToken(tokenPayload);
    const refreshToken = securityService.generateRefreshToken(tokenPayload);

    // Log Audit Event
    auditService.logEvent({
      eventType: 'LOGIN',
      userId: user.id,
      userRole: user.role,
      ipAddress,
      userAgent,
      action: 'LOGIN',
      details: `User ${user.email} logged in with role ${user.role}`,
      status: 'SUCCESS',
    });

    return {
      ...session,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Register a user with password hashing (Bcrypt/Argon2 compliant)
   */
  public static async registerWithPassword(email: string, password: string, roleInput?: string): Promise<User> {
    if (!email || !password) {
      throw new ValidationError('Email and password are required.');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (this.userDatabase.has(normalizedEmail)) {
      throw new ValidationError('A user with this email address already exists.');
    }

    const passwordHash = await securityService.hashPassword(password);
    const derivedRole = authorizationService.normalizeRole(roleInput || 'viewer');
    const emailPrefix = normalizedEmail.split('@')[0];
    const cleanUsername = emailPrefix.replace(/[^a-zA-Z0-9_]/g, '_') || 'user';
    const userId = `usr_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;

    const user: User = {
      id: userId,
      email: normalizedEmail,
      username: cleanUsername,
      role: derivedRole,
      status: 'idle',
      connectedAt: Date.now(),
    };

    this.userDatabase.set(normalizedEmail, { user, passwordHash });
    return user;
  }

  /**
   * Refresh JWT Access Token with Token Rotation
   */
  public static refreshToken(refreshTokenStr: string, ipAddress?: string): { accessToken: string; refreshToken: string } {
    if (!refreshTokenStr) {
      throw new AuthenticationError('Refresh token required.');
    }

    try {
      const decoded = securityService.verifyRefreshToken(refreshTokenStr);
      
      // Revoke current refresh token to enforce one-time rotation
      securityService.revokeToken(refreshTokenStr);

      const session = Array.from(sessionStore['sessions'].values()).find((s) => s.user.id === decoded.userId);
      const user = session?.user || {
        id: decoded.userId,
        email: 'user@example.com',
        username: 'user',
        role: 'viewer',
        status: 'idle',
        connectedAt: Date.now(),
      };

      const tokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role || 'viewer',
      };

      const newAccessToken = securityService.generateAccessToken(tokenPayload);
      const newRefreshToken = securityService.generateRefreshToken(tokenPayload);

      auditService.logEvent({
        eventType: 'TOKEN_REFRESH',
        userId: user.id,
        userRole: user.role,
        ipAddress,
        action: 'TOKEN_REFRESH',
        details: 'Rotated JWT access and refresh tokens',
        status: 'SUCCESS',
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err: any) {
      throw new AuthenticationError(`Invalid or expired refresh token: ${err.message}`);
    }
  }

  /**
   * Retrieves an active session by token or verifies JWT Access Token
   */
  public static getSession(token: string): SessionData {
    if (!token) {
      throw new AuthenticationError('Authentication session token is required');
    }

    // First try JWT Access Token verification
    try {
      const decoded = securityService.verifyAccessToken(token);
      const session = sessionStore.getSession(token);
      if (session) return session;

      // Construct transient session from valid JWT token payload
      const user: User = {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        role: authorizationService.normalizeRole(decoded.role),
        status: 'idle',
        connectedAt: Date.now(),
      };
      return { token, user, loginTimestamp: new Date().toISOString() };
    } catch (err) {
      // Fallback to legacy session store lookup
      const session = sessionStore.getSession(token);
      if (!session) {
        throw new AuthenticationError('Invalid or expired session token');
      }
      return session;
    }
  }

  /**
   * Invalidates session and revokes JWT tokens on logout
   */
  public static logout(token: string, ipAddress?: string): void {
    if (token) {
      try {
        const session = this.getSession(token);
        if (session && session.user) {
          presenceService.removePresenceByUserId(session.user.id);
          broadcastPresenceUpdate();

          auditService.logEvent({
            eventType: 'LOGOUT',
            userId: session.user.id,
            userRole: session.user.role,
            ipAddress,
            action: 'LOGOUT',
            details: `User ${session.user.email} logged out`,
            status: 'SUCCESS',
          });
        }
      } catch (e) {
        // ignore
      }

      // Revoke the token
      securityService.revokeToken(token);
      sessionStore.deleteSession(token);
    }
  }
}
