import { CacheService } from './cache.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('CacheService', () => {
  let service: CacheService;
  let mockRedis: any;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when cache is enabled', () => {
    beforeEach(() => {
      mockConfigService = {
        get: jest.fn().mockReturnValue({
          enabled: true,
          defaultTtl: 300,
        }),
      } as any;

      service = new CacheService(mockRedis, mockConfigService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should get cached value', async () => {
      const testData = { id: '1', name: 'test' };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(testData));

      const result = await service.get('test-key');

      expect(result).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await service.get('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null and log error on get failure', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Redis error'));

      const result = await service.get('error-key');

      expect(result).toBeNull();
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should set value with default TTL', async () => {
      const testData = { id: '1', name: 'test' };

      await service.set('test-key', testData);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        300, // default TTL
        JSON.stringify(testData),
      );
    });

    it('should set value with custom TTL', async () => {
      const testData = { id: '1', name: 'test' };

      await service.set('test-key', testData, 600);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        600,
        JSON.stringify(testData),
      );
    });

    it('should not throw on set failure', async () => {
      mockRedis.setex.mockRejectedValueOnce(new Error('Redis error'));

      await expect(
        service.set('error-key', { test: 'data' }),
      ).resolves.toBeUndefined();
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should delete a key', async () => {
      await service.del('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should not throw on delete failure', async () => {
      mockRedis.del.mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.del('error-key')).resolves.toBeUndefined();
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should delete keys matching pattern', async () => {
      mockRedis.keys.mockResolvedValueOnce(['key1', 'key2', 'key3']);
      mockRedis.del.mockResolvedValueOnce(3);

      await service.delPattern('test:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('test:*');
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('should not delete when no keys match pattern', async () => {
      mockRedis.keys.mockResolvedValueOnce([]);

      await service.delPattern('nonexistent:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('nonexistent:*');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should not throw on delPattern failure', async () => {
      mockRedis.keys.mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.delPattern('error:*')).resolves.toBeUndefined();
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should return true when healthy', async () => {
      const healthy = await service.isHealthy();

      expect(healthy).toBe(true);
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it('should return false when ping fails', async () => {
      mockRedis.ping.mockRejectedValueOnce(new Error('Connection error'));

      const healthy = await service.isHealthy();

      expect(healthy).toBe(false);
    });
  });

  describe('when cache is disabled', () => {
    beforeEach(() => {
      mockConfigService = {
        get: jest.fn().mockReturnValue({
          enabled: false,
          defaultTtl: 300,
        }),
      } as any;

      service = new CacheService(mockRedis, mockConfigService);
    });

    it('should return null on get', async () => {
      const result = await service.get('any-key');

      expect(result).toBeNull();
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('should not set value', async () => {
      await service.set('any-key', { test: 'data' });

      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should not delete key', async () => {
      await service.del('any-key');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should not delete pattern', async () => {
      await service.delPattern('any:*');

      expect(mockRedis.keys).not.toHaveBeenCalled();
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should return true for isHealthy (no-op mode)', async () => {
      const healthy = await service.isHealthy();

      expect(healthy).toBe(true);
      expect(mockRedis.ping).not.toHaveBeenCalled();
    });
  });
});
