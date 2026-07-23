import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/env';
import { sendSuccess, sendError } from '../utils/response';
import { memoryStore } from '../store/memoryStore';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../../shared/types';
import { Logger } from '../utils/logger';

// Helper email format validator
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthController {
  static login(req: AuthenticatedRequest, res: Response) {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return sendError(res, 'A valid email address is required', 'INVALID_EMAIL', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const username = cleanEmail.split('@')[0];

    // Check if user already registered in memory store, else create new
    let user = memoryStore.getOnlineUsers().find((u) => u.email === cleanEmail);

    if (!user) {
      const newUser: User = {
        id: `usr_${uuidv4().substring(0, 8)}`,
        email: cleanEmail,
        username,
        status: 'idle',
        connectedAt: Date.now(),
      };
      user = memoryStore.setUser(newUser);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      ENV.JWT_SECRET,
      { expiresIn: '24h' }
    );

    Logger.info('Auth', `User logged in: ${cleanEmail}`);

    return sendSuccess(res, 'Login successful', { user, token });
  }

  static getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return sendError(res, 'User context not found', 'UNAUTHORIZED', 401);
    }
    const user = memoryStore.getUser(req.user.id) || req.user;
    return sendSuccess(res, 'Current user profile retrieved', { user });
  }
}
