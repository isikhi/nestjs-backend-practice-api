import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../../config/configuration';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<DatabaseConfig>('database')!;
        return {
          uri: dbConfig.uri,
          serverSelectionTimeoutMS: 5000,
          autoIndex: true,
          autoCreate: true,
        };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
