import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { RedisModule } from './redis.module';
import { CacheService } from './cache.service';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  cacheConfig,
} from '../../config/configuration';

describe('RedisModule', () => {
  let module: TestingModule;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(async () => {
    process.env = originalEnv;

    jest.restoreAllMocks();

    if (module) {
      const client = module.get('REDIS_CLIENT', { strict: false }) as any;
      client.quit
        ? await client
            ?.quit()
            .catch(() => client.disconnect && client.disconnect())
        : client.disconnect && client.disconnect();
      await module.close();
    }
  });

  it('should provide CacheService when cache is disabled', async () => {
    process.env.CACHE_ENABLED = 'false';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig, databaseConfig, redisConfig, cacheConfig],
        }),
        RedisModule,
      ],
    }).compile();

    const cacheService = module.get<CacheService>(CacheService);
    expect(cacheService).toBeDefined();
  });

  it('should provide REDIS_CLIENT when cache is disabled (mock client)', async () => {
    process.env.CACHE_ENABLED = 'false';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig, databaseConfig, redisConfig, cacheConfig],
        }),
        RedisModule,
      ],
    }).compile();

    const redisClient = module.get('REDIS_CLIENT');
    expect(redisClient).toBeDefined();
    expect(typeof redisClient.get).toBe('function');
    expect(typeof redisClient.ping).toBe('function');
  });

  it('should provide CacheService when cache is enabled(even redis can not be accessible)', async () => {
    process.env.CACHE_ENABLED = 'true';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig, databaseConfig, redisConfig, cacheConfig],
        }),
        RedisModule,
      ],
    }).compile();

    const cacheService = module.get<CacheService>(CacheService);
    expect(cacheService).toBeDefined();
  });

  it('should export CacheService', async () => {
    process.env.CACHE_ENABLED = 'false';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig, databaseConfig, redisConfig, cacheConfig],
        }),
        RedisModule,
      ],
    }).compile();

    const exported = module.get(CacheService);
    expect(exported).toBeDefined();
  });
});
