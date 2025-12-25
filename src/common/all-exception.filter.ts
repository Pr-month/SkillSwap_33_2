import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { PostgresError } from 'src/types/postgres-error.interface';
import { QueryFailedError } from 'typeorm';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // HTTP ошибки (в т.ч. передается слишком большой файл)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }

    // Сущность не найдена
    else if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Entity not found';
    }

    // Ошибка дубликата
    else if (exception instanceof QueryFailedError) {
      const err = exception as PostgresError;

      if (err.code === '23505') {
        status = HttpStatus.CONFLICT;
        message = err.detail?.includes('email')
          ? 'Email is already used'
          : 'Duplicate entity';
      }
    }

    // Любая другая ошибка
    else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
