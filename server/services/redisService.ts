import Redis from 'ioredis';
import { Logger } from '../utils/logger';

export class RedisService {
  private static instance: RedisService;
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private hasLoggedError: boolean = false;
  private fallbackStore = new Map<string, { value: any; expiresAt?: number }>();

  private constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 2) {
            return null; // Stop retrying, fall back gracefully
          }
          return Math.min(times * 100, 1000);
        },
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.hasLoggedError = false;
        Logger.info('RedisService', 'Connected to Redis server successfully');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        if (!this.hasLoggedError) {
          this.hasLoggedError = true;
          Logger.warn('RedisService', `Redis connection unavailable (${err.message}). Operating in fault-tolerant fallback mode.`);
        }
      });

      this.client.connect().catch((err) => {
        this.isConnected = false;
        if (!this.hasLoggedError) {
          this.hasLoggedError = true;
          Logger.warn('RedisService', `Redis connection unavailable (${err.message}). Operating in fault-tolerant fallback mode.`);
        }
      });
    } catch (err: any) {
      this.isConnected = false;
      if (!this.hasLoggedError) {
        this.hasLoggedError = true;
        Logger.warn('RedisService', `Failed to initialize Redis client: ${err.message}`);
      }
    }
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public isReady(): boolean {
    return this.isConnected && this.client?.status === 'ready';
  }

  // Key-Value operations
  public async get<T = any>(key: string): Promise<T | null> {
    if (this.isReady() && this.client) {
      try {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        Logger.warn('RedisService', `get error for key ${key}, using fallback store`);
      }
    }
    // Fallback store
    const item = this.fallbackStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.fallbackStore.delete(key);
      return null;
    }
    return item.value;
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (this.isReady() && this.client) {
      try {
        if (ttlSeconds && ttlSeconds > 0) {
          await this.client.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, serialized);
        }
      } catch (err) {
        Logger.warn('RedisService', `set error for key ${key}, using fallback store`);
      }
    }
    // Fallback store
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.fallbackStore.set(key, { value, expiresAt });
  }

  public async del(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];
    if (keys.length === 0) return;

    if (this.isReady() && this.client) {
      try {
        await this.client.del(...keys);
      } catch (err) {
        Logger.warn('RedisService', `del error for keys ${keys.join(',')}`);
      }
    }
    keys.forEach((k) => this.fallbackStore.delete(k));
  }

  // Hash Operations
  public async hget<T = any>(key: string, field: string): Promise<T | null> {
    if (this.isReady() && this.client) {
      try {
        const val = await this.client.hget(key, field);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        Logger.warn('RedisService', `hget error for ${key}:${field}`);
      }
    }
    const hash = (await this.get<Record<string, any>>(key)) || {};
    return hash[field] ?? null;
  }

  public async hgetall<T = any>(key: string): Promise<Record<string, T>> {
    if (this.isReady() && this.client) {
      try {
        const res = await this.client.hgetall(key);
        const parsed: Record<string, T> = {};
        for (const [k, v] of Object.entries(res)) {
          parsed[k] = JSON.parse(v);
        }
        return parsed;
      } catch (err) {
        Logger.warn('RedisService', `hgetall error for ${key}`);
      }
    }
    return (await this.get<Record<string, T>>(key)) || {};
  }

  public async hset(key: string, field: string, value: any): Promise<void> {
    const serialized = JSON.stringify(value);
    if (this.isReady() && this.client) {
      try {
        await this.client.hset(key, field, serialized);
      } catch (err) {
        Logger.warn('RedisService', `hset error for ${key}:${field}`);
      }
    }
    const hash = (await this.get<Record<string, any>>(key)) || {};
    hash[field] = value;
    await this.set(key, hash);
  }

  public async hdel(key: string, field: string): Promise<void> {
    if (this.isReady() && this.client) {
      try {
        await this.client.hdel(key, field);
      } catch (err) {
        Logger.warn('RedisService', `hdel error for ${key}:${field}`);
      }
    }
    const hash = (await this.get<Record<string, any>>(key)) || {};
    delete hash[field];
    await this.set(key, hash);
  }

  // Pattern key matching
  public async delByPattern(pattern: string): Promise<void> {
    if (this.isReady() && this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } catch (err) {
        Logger.warn('RedisService', `delByPattern error for pattern ${pattern}`);
      }
    }
    const prefix = pattern.replace('*', '');
    for (const key of Array.from(this.fallbackStore.keys())) {
      if (key.startsWith(prefix)) {
        this.fallbackStore.delete(key);
      }
    }
  }
}

export const redisService = RedisService.getInstance();
