import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestIdInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const requestId = req.headers['x-request-id'] || uuidv4();
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
