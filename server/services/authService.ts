import { ValidationError, AuthenticationError } from '../../shared/errors/errors';
import { User } from '../../shared/types';
import { sessionStore, SessionData } from '../store/sessionStore';

export class AuthService {
  /**
   * Validates email format and creates an in-memory session
   */
  public static login(email: string): SessionData {
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

    // Derive username from email prefix and generate unique User ID
    const emailPrefix = trimmedEmail.split('@')[0];
    const cleanUsername = emailPrefix.replace(/[^a-zA-Z0-9_]/g, '_') || 'user';
    const userId = `usr_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;

    const user: User = {
      id: userId,
      email: trimmedEmail.toLowerCase(),
      username: cleanUsername,
      status: 'idle',
      connectedAt: Date.now(),
    };

    return sessionStore.createSession(user);
  }

  /**
   * Retrieves an active session by token
   */
  public static getSession(token: string): SessionData {
    if (!token) {
      throw new AuthenticationError('Authentication session token is required');
    }

    const session = sessionStore.getSession(token);
    if (!session) {
      throw new AuthenticationError('Invalid or expired session token');
    }

    return session;
  }

  /**
   * Invalidates a session by token
   */
  public static logout(token: string): void {
    if (token) {
      sessionStore.deleteSession(token);
    }
  }
}
