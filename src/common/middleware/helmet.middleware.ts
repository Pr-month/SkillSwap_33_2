import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

@Injectable()
export class HelmetMiddleware implements NestMiddleware {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  use(req: Request, res: Response, next: NextFunction) {
    const helmetMiddleware = helmet({
      // Временно отключаем CSP в development - чтобы не сломать Swagger
      contentSecurityPolicy: this.isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"], // Для Swagger и inline стилей
              scriptSrc: ["'self'", "'unsafe-inline'"], // Для Swagger
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'], // Для изображений и данных
              fontSrc: ["'self'", 'https:', 'data:'], // Для шрифтов
              connectSrc: ["'self'"], // Для API запросов
            },
          }
        : false,

      // Включаем XSS защиту
      xXssProtection: true,

      // Скрывает X-Powered-By заголовок
      hidePoweredBy: true,

      // Защита от clickjacking
      frameguard: { action: 'sameorigin' },

      // HSTS только в production
      hsts: this.isProduction
        ? {
            maxAge: 31536000, // 1 год
            includeSubDomains: true,
            preload: true,
          }
        : false,

      // Защита для IE
      ieNoOpen: true,

      // Запрещает MIME-sniffing
      noSniff: true,

      // Политика реферера
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    });

    // Применяем helmet middleware
    helmetMiddleware(req, res, next);
  }
}
