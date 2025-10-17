import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MoviesModule } from './modules/movies/movies.module';
import { DirectorsModule } from './modules/directors/directors.module';
import { MongoModule } from './infra/mongo/mongo.module';
import { RedisModule } from './infra/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  cacheConfig,
} from './config/configuration';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, cacheConfig],
      cache: true,
    }),
    MongoModule,
    RedisModule,
    MoviesModule,
    DirectorsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
