import { redisService } from './redisService';
import { Logger } from '../utils/logger';

export class CacheService {
  private static instance: CacheService;

  private static KEYS = {
    CREATOR_PROFILE: (creatorId: string) => `cache:creator:profile:${creatorId}`,
    DISCOVERY_RESULTS: (params: string) => `cache:discovery:${params}`,
    TRENDING_CREATORS: 'cache:trending_creators',
    CATEGORY_LISTS: 'cache:categories',
    CREATOR_SETTINGS: (creatorId: string) => `cache:creator:settings:${creatorId}`,
  };

  private static DEFAULT_TTL = 300; // 5 minutes default TTL

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Cache Creator Profile
  public async getCreatorProfile(creatorId: string): Promise<any | null> {
    return redisService.get(CacheService.KEYS.CREATOR_PROFILE(creatorId));
  }

  public async setCreatorProfile(creatorId: string, data: any, ttl = CacheService.DEFAULT_TTL): Promise<void> {
    await redisService.set(CacheService.KEYS.CREATOR_PROFILE(creatorId), data, ttl);
  }

  public async invalidateCreatorProfile(creatorId: string): Promise<void> {
    await redisService.del(CacheService.KEYS.CREATOR_PROFILE(creatorId));
    await this.invalidateDiscovery();
    await this.invalidateTrending();
    Logger.info('CacheService', `Invalidated profile & discovery cache for creator ${creatorId}`);
  }

  // Cache Discovery Results
  public async getDiscovery(paramsKey: string): Promise<any | null> {
    return redisService.get(CacheService.KEYS.DISCOVERY_RESULTS(paramsKey));
  }

  public async setDiscovery(paramsKey: string, data: any, ttl = CacheService.DEFAULT_TTL): Promise<void> {
    await redisService.set(CacheService.KEYS.DISCOVERY_RESULTS(paramsKey), data, ttl);
  }

  public async invalidateDiscovery(): Promise<void> {
    await redisService.delByPattern('cache:discovery:*');
  }

  // Cache Trending Creators
  public async getTrending(): Promise<any | null> {
    return redisService.get(CacheService.KEYS.TRENDING_CREATORS);
  }

  public async setTrending(data: any, ttl = CacheService.DEFAULT_TTL): Promise<void> {
    await redisService.set(CacheService.KEYS.TRENDING_CREATORS, data, ttl);
  }

  public async invalidateTrending(): Promise<void> {
    await redisService.del(CacheService.KEYS.TRENDING_CREATORS);
  }

  // Cache Category Lists
  public async getCategories(): Promise<any | null> {
    return redisService.get(CacheService.KEYS.CATEGORY_LISTS);
  }

  public async setCategories(data: any, ttl = 3600): Promise<void> {
    await redisService.set(CacheService.KEYS.CATEGORY_LISTS, data, ttl);
  }

  public async invalidateCategories(): Promise<void> {
    await redisService.del(CacheService.KEYS.CATEGORY_LISTS);
    await this.invalidateDiscovery();
  }

  // Cache Creator Settings
  public async getCreatorSettings(creatorId: string): Promise<any | null> {
    return redisService.get(CacheService.KEYS.CREATOR_SETTINGS(creatorId));
  }

  public async setCreatorSettings(creatorId: string, data: any, ttl = 600): Promise<void> {
    await redisService.set(CacheService.KEYS.CREATOR_SETTINGS(creatorId), data, ttl);
  }

  public async invalidateCreatorSettings(creatorId: string): Promise<void> {
    await redisService.del(CacheService.KEYS.CREATOR_SETTINGS(creatorId));
  }

  // Comprehensive Invalidation triggers as required by EWO-022:
  public async onProfileUpdate(creatorId: string): Promise<void> {
    await this.invalidateCreatorProfile(creatorId);
  }

  public async onWalletChange(userId: string): Promise<void> {
    await redisService.del(`cache:wallet:${userId}`);
  }

  public async onStreamStart(creatorId: string): Promise<void> {
    await this.invalidateCreatorProfile(creatorId);
    await this.invalidateDiscovery();
    await this.invalidateTrending();
  }

  public async onStreamEnd(creatorId: string): Promise<void> {
    await this.invalidateCreatorProfile(creatorId);
    await this.invalidateDiscovery();
    await this.invalidateTrending();
  }

  public async onFollowChange(creatorId: string): Promise<void> {
    await this.invalidateCreatorProfile(creatorId);
  }

  public async onCategoryChange(): Promise<void> {
    await this.invalidateCategories();
  }
}

export const cacheService = CacheService.getInstance();
