import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheConfig } from '../../config/configuration';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly enabled: boolean;
  private readonly defaultTTL: number;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    const cacheConfig = this.configService.get<CacheConfig>('cache')!;

    this.enabled = cacheConfig.enabled;
    this.defaultTTL = cacheConfig.defaultTtl;

    if (!this.enabled) {
      this.logger.warn('Cache is DISABLED via configuration');
    } else {
      this.logger.log(`Cache is ENABLED with default TTL: ${this.defaultTTL}s`);
    }
  }

  /**
   * Get a cached value by key.
   * Returns null if key doesn't exist or cache is disabled.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const value = await this.redis.get(key);
      if (!value) {
        this.logger.debug(`Cache MISS for key "${key}"`);
        return null;
      }

      this.logger.debug(`Cache HIT for key "${key}"`);
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Cache GET error for key "${key}":`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.enabled) return;

    try {
      const serialized = JSON.stringify(value);
      const effectiveTTL = ttl ?? this.defaultTTL;
      await this.redis.setex(key, effectiveTTL, serialized);
      this.logger.debug(`Cache SET key "${key}" ttl=${effectiveTTL}s`);
    } catch (error) {
      this.logger.error(`Cache SET error for key "${key}":`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled) return;

    try {
      const deleted = await this.redis.del(key);
      this.logger.debug(`Cache DEL key "${key}" deleted=${deleted}`);
    } catch (error) {
      this.logger.error(`Cache DEL error for key "${key}":`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.enabled) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        const deleted = await this.redis.del(...keys);
        this.logger.debug(
          `Invalidated ${keys.length} keys matching pattern "${pattern}" deleted=${deleted}`,
        );
      }
    } catch (error) {
      this.logger.error(`Cache DEL pattern error for "${pattern}":`, error);
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.enabled) return true; // If disabled, consider it healthy (noop)

    try {
      this.logger.debug('Cache health check: pinging redis');
      await this.redis.ping();
      this.logger.debug('Cache health check: redis responded to ping');
      return true;
    } catch {
      this.logger.debug('Cache health check: redis ping failed');
      return false;
    }
  }
}
