import { FollowRecord } from '../../shared/types';
import { ValidationError, NotFoundError } from '../../shared/errors/errors';
import { getIO } from '../socket/socketHandler';
import { SOCKET_EVENTS } from '../../shared/events';
import { Logger } from '../utils/logger';

export class FollowService {
  private static instance: FollowService;

  // Map of followId -> FollowRecord
  private follows = new Map<string, FollowRecord>();

  public static getInstance(): FollowService {
    if (!FollowService.instance) {
      FollowService.instance = new FollowService();
    }
    return FollowService.instance;
  }

  /**
   * Check key string for relationship
   */
  private makeKey(followerId: string, creatorId: string): string {
    return `${followerId}:${creatorId}`;
  }

  /**
   * Follow a creator with validation
   */
  public follow(followerId: string, creatorId: string, creatorExistsCheck?: (id: string) => boolean): FollowRecord {
    if (!followerId || !creatorId) {
      throw new ValidationError('Follower ID and Creator ID are required');
    }

    if (followerId === creatorId) {
      throw new ValidationError('You cannot follow yourself');
    }

    if (creatorExistsCheck && !creatorExistsCheck(creatorId)) {
      throw new NotFoundError(`Creator with ID ${creatorId} does not exist`);
    }

    const key = this.makeKey(followerId, creatorId);
    if (this.follows.has(key)) {
      throw new ValidationError('You are already following this creator');
    }

    const record: FollowRecord = {
      id: `flw_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`,
      followerId,
      creatorId,
      createdAt: Date.now(),
    };

    this.follows.set(key, record);

    Logger.info('FollowService', `User ${followerId} followed creator ${creatorId}`);

    // Emit socket event notification
    const io = getIO();
    if (io) {
      io.to(`user:${creatorId}`).emit(SOCKET_EVENTS.CREATOR_FOLLOWED, {
        followerId,
        creatorId,
        followersCount: this.getFollowersCount(creatorId),
        timestamp: record.createdAt,
      });
      io.emit(SOCKET_EVENTS.CREATOR_FOLLOWED, {
        followerId,
        creatorId,
        followersCount: this.getFollowersCount(creatorId),
      });
    }

    return record;
  }

  /**
   * Unfollow a creator
   */
  public unfollow(followerId: string, creatorId: string): boolean {
    if (!followerId || !creatorId) {
      throw new ValidationError('Follower ID and Creator ID are required');
    }

    const key = this.makeKey(followerId, creatorId);
    if (!this.follows.has(key)) {
      throw new ValidationError('You are not currently following this creator');
    }

    this.follows.delete(key);

    Logger.info('FollowService', `User ${followerId} unfollowed creator ${creatorId}`);

    // Emit socket event notification
    const io = getIO();
    if (io) {
      io.to(`user:${creatorId}`).emit(SOCKET_EVENTS.CREATOR_UNFOLLOWED, {
        followerId,
        creatorId,
        followersCount: this.getFollowersCount(creatorId),
        timestamp: Date.now(),
      });
      io.emit(SOCKET_EVENTS.CREATOR_UNFOLLOWED, {
        followerId,
        creatorId,
        followersCount: this.getFollowersCount(creatorId),
      });
    }

    return true;
  }

  /**
   * Check if a user follows a creator
   */
  public isFollowing(followerId?: string, creatorId?: string): boolean {
    if (!followerId || !creatorId) return false;
    return this.follows.has(this.makeKey(followerId, creatorId));
  }

  /**
   * Get total followers count for a creator
   */
  public getFollowersCount(creatorId: string): number {
    let count = 0;
    for (const record of this.follows.values()) {
      if (record.creatorId === creatorId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get total creators a user is following
   */
  public getFollowingCount(followerId: string): number {
    let count = 0;
    for (const record of this.follows.values()) {
      if (record.followerId === followerId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get list of follower IDs for a creator
   */
  public getFollowersList(creatorId: string): string[] {
    const list: string[] = [];
    for (const record of this.follows.values()) {
      if (record.creatorId === creatorId) {
        list.push(record.followerId);
      }
    }
    return list;
  }

  /**
   * Get list of followed creator IDs for a user
   */
  public getFollowingList(followerId: string): string[] {
    const list: string[] = [];
    for (const record of this.follows.values()) {
      if (record.followerId === followerId) {
        list.push(record.creatorId);
      }
    }
    return list;
  }
}

export const followService = FollowService.getInstance();
