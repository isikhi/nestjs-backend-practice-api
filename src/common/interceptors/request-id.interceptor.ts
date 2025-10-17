import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestWithId } from '../types/express.types';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestIdInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithId>();
    const res = context.switchToHttp().getResponse<Response>();

    let requestId = req.headers['x-request-id'] as string;
    if (!requestId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        requestId = uuidv4();
      } catch (error) {
        this.logger.error(`Failed to generate request ID`, error);
        requestId = 'unknown';
      }
    }
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);

    this.logger.debug(
      `[${requestId}] Request started: ${req.method} ${req.url}`,
    );

    return next.handle().pipe(
      tap(() => {
        this.logger.debug(
          `[${requestId}] Request completed: ${res.statusCode}`,
        );
      }),
    );
  }
}
