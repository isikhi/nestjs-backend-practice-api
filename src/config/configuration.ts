import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export interface DatabaseConfig {
  uri: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  url?: string;
}

export interface CacheConfig {
  enabled: boolean;
  defaultTtl: number;
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  }),
);

export const databaseConfig = registerAs(
  'database',
  (): DatabaseConfig => ({
    uri:
      process.env.MONGO_URI ||
      'mongodb://root:password@localhost:27017/?authSource=admin',
  }),
);

export const redisConfig = registerAs(
  'redis',
  (): RedisConfig => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    url: process.env.REDIS_URL,
  }),
);

export const cacheConfig = registerAs(
  'cache',
  (): CacheConfig => ({
    enabled: process.env.CACHE_ENABLED === 'true',
    defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10),
  }),
);
