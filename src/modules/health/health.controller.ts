import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CacheService } from '../../infra/redis/cache.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CacheConfig } from '../../config/configuration';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly cache: CacheService,
    private readonly configService: ConfigService,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async health() {
    const redisHealthy = await this.cache.isHealthy();
    const cacheConfig = this.configService.get<CacheConfig>('cache')!;

    const mongoHealthy = Number(this.mongoConnection.readyState) === 1; // 1 = connected

    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoHealthy ? 'healthy' : 'unhealthy',
        redis: redisHealthy ? 'healthy' : 'unhealthy',
        cache: cacheConfig.enabled ? 'enabled' : 'disabled',
      },
    };
  }
}
