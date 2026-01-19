import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import logger from './winston.logger';

@Injectable()
export class WinstonInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;
    const url = req.url;
    const body = JSON.stringify(req.body ?? {});
    const params = JSON.stringify(req.params ?? {});
    const query = JSON.stringify(req.query ?? {});
    const start = Date.now();

    return next.handle().pipe(
      tap((data: unknown) => {
        logger.info('HTTP Request', {
          method,
          url,
          body,
          params,
          query,
          duration: Date.now() - start,
          response: data,
        });
      }),
      catchError((err: unknown) => {
        let errorMsg = 'Unknown error';
        let errorStack: string | undefined = undefined;
        if (typeof err === 'object' && err !== null) {
          if (
            'message' in err &&
            typeof (err as { message?: unknown }).message === 'string'
          ) {
            errorMsg = (err as { message: string }).message;
          }
          if (
            'stack' in err &&
            typeof (err as { stack?: unknown }).stack === 'string'
          ) {
            errorStack = (err as { stack: string }).stack;
          }
        }
        logger.error('HTTP Error', {
          method,
          url,
          body,
          params,
          query,
          duration: Date.now() - start,
          error: errorMsg,
          stack: errorStack,
        });
        throw err;
      }),
    );
  }
}
