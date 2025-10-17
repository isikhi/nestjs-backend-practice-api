import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppValidationPipe } from './common/pipes/validation.pipe';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app')!;

  app.setGlobalPrefix('v1');
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(AppValidationPipe);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());

  if (appConfig.nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Movie API')
      .setDescription('API for managing movies and directors')
      .setVersion('1.0')
      .addTag('movies')
      .addTag('directors')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(appConfig.port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
