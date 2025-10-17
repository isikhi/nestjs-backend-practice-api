import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheService } from './cache.service';
import { CacheConfig, RedisConfig } from '../../config/configuration';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const cacheConfig = configService.get<CacheConfig>('cache')!;
        const redisConfig = configService.get<RedisConfig>('redis')!;
        if (!cacheConfig.enabled) {
          Logger.log(
            'Redis client NOT created (cache disabled)',
            'RedisModule',
          );
          // Return a mock client that does nothing
          return {
            get: () => Promise.resolve(null),
            set: () => Promise.resolve('OK'),
            setex: () => Promise.resolve('OK'),
            del: () => Promise.resolve(0),
            keys: () => Promise.resolve([]),
            ping: () => Promise.resolve('PONG'),
            on: () => {},
            quit: () => Promise.resolve('OK'),
          } as unknown as Redis;
        }

        Logger.log('Creating Redis client connection', 'RedisModule');
        const redisUrl =
          redisConfig.url || `redis://${redisConfig.host}:${redisConfig.port}`;

        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) {
              Logger.error(
                'Redis connection failed after 3 retries',
                'RedisModule',
              );
              return null; // Stop retrying
            }
            return Math.min(times * 100, 1000); // Retry with backoff
          },
        });

        client.on('error', (err) => {
          Logger.error(`Redis connection error: ${err.message}`, 'RedisModule');
        });

        client.on('connect', () => {
          Logger.log('Redis client connected successfully', 'RedisModule');
        });

        return client;
      },
    },
    CacheService,
  ],
  exports: ['REDIS_CLIENT', CacheService],
})
export class RedisModule {}
