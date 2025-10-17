import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestWithId } from '../types/express.types';

interface MongooseError {
  name?: string;
  kind?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    const requestId = request.id || 'no-id';
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

    const mongooseError = exception as MongooseError;
    if (
      mongooseError &&
      (mongooseError.name === 'CastError' || mongooseError.kind === 'ObjectId')
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
