import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request as any).id ||
      (request.headers &&
        (request.headers['x-request-id'] || request.headers['X-Request-Id'])) ||
      'no-id';
    const trace =
      exception instanceof Error ? exception.stack : JSON.stringify(exception);
    this.logger.error(
      `[${requestId}] Unhandled exception caught by AllExceptionsFilter`,
      trace,
    );
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = exception.getResponse();
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        context: message,
      });
      return;
    }

    const anyEx = exception as Record<string, unknown> | undefined;
    if (
      anyEx &&
      ((anyEx as any).name === 'CastError' ||
        (anyEx as any).kind === 'ObjectId')
    ) {
      const status = HttpStatus.BAD_REQUEST;
      const message = { error: 'Invalid identifier format' };
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        context: message,
      });
      return;
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = { error: 'Internal server error' };
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      context: message,
    });
  }
}
