import { MediaMetadata } from '../../shared/types';
import { redisService } from './redisService';
import { Logger } from '../utils/logger';

export class MediaRepository {
  private static instance: MediaRepository;
  private mediaMap = new Map<string, MediaMetadata>();

  private static REDIS_KEY_PREFIX = 'media:meta:';

  public static getInstance(): MediaRepository {
    if (!MediaRepository.instance) {
      MediaRepository.instance = new MediaRepository();
    }
    return MediaRepository.instance;
  }

  public async save(metadata: MediaMetadata): Promise<MediaMetadata> {
    this.mediaMap.set(metadata.id, metadata);

    // Cache in Redis with 7-day TTL
    try {
      await redisService.set(`${MediaRepository.REDIS_KEY_PREFIX}${metadata.id}`, metadata, 86400 * 7);
    } catch (err: any) {
      Logger.warn('MediaRepository', `Failed to cache media metadata in Redis: ${err.message}`);
    }

    Logger.info('MediaRepository', `Saved media metadata ${metadata.id} for owner ${metadata.ownerId}`);
    return metadata;
  }

  public async findById(id: string): Promise<MediaMetadata | null> {
    // Check local map
    if (this.mediaMap.has(id)) {
      return this.mediaMap.get(id)!;
    }

    // Check Redis cache
    try {
      const cached = await redisService.get<MediaMetadata>(`${MediaRepository.REDIS_KEY_PREFIX}${id}`);
      if (cached) {
        this.mediaMap.set(id, cached);
        return cached;
      }
    } catch (err) {
      // Fallback
    }

    return null;
  }

  public async delete(id: string): Promise<boolean> {
    this.mediaMap.delete(id);
    try {
      await redisService.del(`${MediaRepository.REDIS_KEY_PREFIX}${id}`);
    } catch {
      // Ignore
    }
    return true;
  }

  public async findByOwnerId(ownerId: string): Promise<MediaMetadata[]> {
    const list: MediaMetadata[] = [];
    for (const item of this.mediaMap.values()) {
      if (item.ownerId === ownerId) {
        list.push(item);
      }
    }
    return list;
  }
}

export const mediaRepository = MediaRepository.getInstance();
