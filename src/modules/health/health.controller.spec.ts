import { HealthController } from './health.controller';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../infra/redis/cache.service';
import { Connection } from 'mongoose';

describe('HealthController', () => {
  let controller: HealthController;
  let mockCacheService: Partial<CacheService>;
  let mockConfigService: Partial<ConfigService>;
  let mockMongoConnection: any;

  beforeEach(() => {
    mockCacheService = {
      isHealthy: jest.fn(),
    };
    mockConfigService = {
      get: jest.fn().mockReturnValue({
        enabled: true,
        defaultTtl: 300,
      }),
    };
    mockMongoConnection = {
      readyState: 1, // 1 = connected
    };
    controller = new HealthController(
      mockCacheService as CacheService,
      mockConfigService as ConfigService,
      mockMongoConnection as Connection,
    );
  });

  describe('health', () => {
    it('should return healthy status when all services are available', async () => {
      (mockCacheService.isHealthy as jest.Mock).mockResolvedValue(true);
      (mockConfigService.get as jest.Mock).mockReturnValue({
        enabled: true,
        defaultTtl: 300,
      });

      const result = await controller.health();

      expect(result).toEqual({
        status: 'ok',
        uptime: expect.any(Number),
        timestamp: expect.any(String),
        services: {
          mongodb: 'healthy',
          redis: 'healthy',
          cache: 'enabled',
        },
      });
    });

    it('should return unhealthy status when Redis is down', async () => {
      (mockCacheService.isHealthy as jest.Mock).mockResolvedValue(false);

      const result = await controller.health();

      expect(result.services.redis).toBe('unhealthy');
      expect(result.services.mongodb).toBe('healthy');
    });

    it('should return unhealthy status when MongoDB is disconnected', async () => {
      (mockCacheService.isHealthy as jest.Mock).mockResolvedValue(true);
      mockMongoConnection.readyState = 0; // 0 = disconnected

      const result = await controller.health();

      expect(result.services.mongodb).toBe('unhealthy');
      expect(result.services.redis).toBe('healthy');
    });

    it('should show cache disabled when config has cache disabled', async () => {
      (mockCacheService.isHealthy as jest.Mock).mockResolvedValue(true);
      (mockConfigService.get as jest.Mock).mockReturnValue({
        enabled: false,
        defaultTtl: 300,
      });

      const result = await controller.health();

      expect(result.services.cache).toBe('disabled');
    });
  });
});
