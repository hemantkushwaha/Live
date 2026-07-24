import { PresenceUser, User } from '../../shared/types';
import { Logger } from '../utils/logger';

export class PresenceService {
  private static instance: PresenceService;

  // Map of userId -> PresenceUser
  private usersMap = new Map<string, PresenceUser>();

  // Map of socketId -> userId
  private socketToUserMap = new Map<string, string>();

  public static getInstance(): PresenceService {
    if (!PresenceService.instance) {
      PresenceService.instance = new PresenceService();
    }
    return PresenceService.instance;
  }

  /**
   * Register or update a user's presence for a connected socket
   */
  public addPresence(socketId: string, user: User): PresenceUser {
    const now = Date.now();
    const existing = this.usersMap.get(user.id);

    const presenceUser: PresenceUser = {
      userId: user.id,
      email: user.email,
      username: user.username,
      socketId,
      connectedAt: existing ? existing.connectedAt : (user.connectedAt || now),
      lastSeen: now,
    };

    this.usersMap.set(user.id, presenceUser);
    this.socketToUserMap.set(socketId, user.id);

    Logger.info('PresenceService', `User ${user.email} (${user.id}) joined online presence via socket ${socketId}`);
    return presenceUser;
  }

  /**
   * Remove presence associated with a disconnected socket
   */
  public removePresenceBySocketId(socketId: string): PresenceUser | null {
    const userId = this.socketToUserMap.get(socketId);
    if (!userId) return null;

    this.socketToUserMap.delete(socketId);

    // Check if this user has other active socket connections
    const remainingSockets = Array.from(this.socketToUserMap.values()).includes(userId);
    if (!remainingSockets) {
      const removed = this.usersMap.get(userId) || null;
      this.usersMap.delete(userId);
      if (removed) {
        Logger.info('PresenceService', `User ${removed.email} (${userId}) removed from online presence`);
      }
      return removed;
    }

    return null;
  }

  /**
   * Explicitly remove user from presence (e.g. on logout)
   */
  public removePresenceByUserId(userId: string): PresenceUser | null {
    const presenceUser = this.usersMap.get(userId) || null;
    if (presenceUser) {
      this.usersMap.delete(userId);
      for (const [sId, uId] of this.socketToUserMap.entries()) {
        if (uId === userId) {
          this.socketToUserMap.delete(sId);
        }
      }
      Logger.info('PresenceService', `User ${presenceUser.email} (${userId}) logged out and removed from presence`);
    }
    return presenceUser;
  }

  /**
   * Update heartbeat timestamp for a connected user socket
   */
  public updateHeartbeat(socketId: string): PresenceUser | null {
    const userId = this.socketToUserMap.get(socketId);
    if (userId) {
      const presenceUser = this.usersMap.get(userId);
      if (presenceUser) {
        presenceUser.lastSeen = Date.now();
        this.usersMap.set(userId, presenceUser);
        return presenceUser;
      }
    }
    return null;
  }

  /**
   * Get list of all currently online users
   */
  public getOnlineUsers(): PresenceUser[] {
    return Array.from(this.usersMap.values());
  }

  /**
   * Get presence user by userId
   */
  public getPresenceByUserId(userId: string): PresenceUser | undefined {
    return this.usersMap.get(userId);
  }

  /**
   * Check if a user is currently online
   */
  public isUserOnline(userId: string): boolean {
    return this.usersMap.has(userId);
  }

  /**
   * Clear all presence data (useful for test resets)
   */
  public clearAll(): void {
    this.usersMap.clear();
    this.socketToUserMap.clear();
  }
}

export const presenceService = PresenceService.getInstance();
