import { ValidationPipe } from '@nestjs/common';

export const AppValidationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
});
