import { PresenceUser, User } from '../../shared/types';
import { Logger } from '../utils/logger';
import { redisService } from './redisService';

export class PresenceService {
  private static instance: PresenceService;

  // Local sync cache backed by Redis
  private usersMap = new Map<string, PresenceUser>();
  private socketToUserMap = new Map<string, string>();

  private static REDIS_USERS_KEY = 'presence:users';
  private static REDIS_SOCKETS_KEY = 'presence:sockets';

  public static getInstance(): PresenceService {
    if (!PresenceService.instance) {
      PresenceService.instance = new PresenceService();
      PresenceService.instance.loadFromRedis();
    }
    return PresenceService.instance;
  }

  /**
   * Hydrate local cache from Redis on startup
   */
  private async loadFromRedis(): Promise<void> {
    try {
      const users = await redisService.hgetall<PresenceUser>(PresenceService.REDIS_USERS_KEY);
      for (const [userId, presenceUser] of Object.entries(users)) {
        if (presenceUser && presenceUser.userId) {
          this.usersMap.set(userId, presenceUser);
          if (presenceUser.socketId) {
            this.socketToUserMap.set(presenceUser.socketId, userId);
          }
        }
      }

      const sockets = await redisService.hgetall<string>(PresenceService.REDIS_SOCKETS_KEY);
      for (const [socketId, userId] of Object.entries(sockets)) {
        if (socketId && userId) {
          this.socketToUserMap.set(socketId, userId);
        }
      }

      Logger.info('PresenceService', `Hydrated presence data from Redis (${this.usersMap.size} online users)`);
    } catch (err: any) {
      Logger.warn('PresenceService', `Failed to hydrate presence from Redis: ${err.message}`);
    }
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

    // Persist to Redis asynchronously
    redisService.hset(PresenceService.REDIS_USERS_KEY, user.id, presenceUser).catch((err) => {
      Logger.warn('PresenceService', `Redis hset user presence error: ${err.message}`);
    });
    redisService.hset(PresenceService.REDIS_SOCKETS_KEY, socketId, user.id).catch((err) => {
      Logger.warn('PresenceService', `Redis hset socket mapping error: ${err.message}`);
    });

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
    redisService.hdel(PresenceService.REDIS_SOCKETS_KEY, socketId).catch(() => {});

    // Check if this user has other active socket connections
    const remainingSockets = Array.from(this.socketToUserMap.values()).includes(userId);
    if (!remainingSockets) {
      const removed = this.usersMap.get(userId) || null;
      this.usersMap.delete(userId);
      redisService.hdel(PresenceService.REDIS_USERS_KEY, userId).catch(() => {});

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
      redisService.hdel(PresenceService.REDIS_USERS_KEY, userId).catch(() => {});

      for (const [sId, uId] of this.socketToUserMap.entries()) {
        if (uId === userId) {
          this.socketToUserMap.delete(sId);
          redisService.hdel(PresenceService.REDIS_SOCKETS_KEY, sId).catch(() => {});
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
        redisService.hset(PresenceService.REDIS_USERS_KEY, userId, presenceUser).catch(() => {});
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
   * Clean up stale presences (heartbeat older than timeoutMs)
   */
  public cleanupStalePresence(timeoutMs = 60000): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [userId, presenceUser] of this.usersMap.entries()) {
      if (now - presenceUser.lastSeen > timeoutMs) {
        this.removePresenceByUserId(userId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      Logger.info('PresenceService', `Cleaned up ${cleanedCount} stale online presence records`);
    }
    return cleanedCount;
  }

  /**
   * Clear all presence data
   */
  public clearAll(): void {
    this.usersMap.clear();
    this.socketToUserMap.clear();
    redisService.del([PresenceService.REDIS_USERS_KEY, PresenceService.REDIS_SOCKETS_KEY]).catch(() => {});
  }
}

export const presenceService = PresenceService.getInstance();
