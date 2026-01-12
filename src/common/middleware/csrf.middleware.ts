import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csurf from 'csurf';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  private readonly csrfProtection = csurf({
    cookie: {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict' as const,
    },
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Особый случай: GET /api/auth/csrf-token должен пройти через csurf
    if (req.method === 'GET' && req.path === '/api/auth/csrf-token') {
      return this.csrfProtection(req, res, next);
    }

    // Пропускаем CSRF для остальных безопасных методов
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Исключаем Swagger документацию
    if (req.path.startsWith('/api/docs')) {
      return next();
    }

    // Исключаем публичные endpoints аутентификации
    const publicPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh',
    ];
    if (publicPaths.includes(req.path)) {
      return next();
    }

    // Для всех остальных запросов применяем CSRF защиту
    return this.csrfProtection(req, res, (err?: unknown) => {
      // Безопасная проверка ошибки CSRF
      if (err && typeof err === 'object') {
        const csrfError = err as { code?: string };
        if (csrfError.code === 'EBADCSRFTOKEN') {
          return res.status(403).json({
            statusCode: 403,
            message: 'Invalid CSRF token',
            timestamp: new Date().toISOString(),
          });
        }
      }
      next(err as Error);
    });
  }
}
