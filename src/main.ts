import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config/app.config';
import { ValidationPipe } from '@nestjs/common';
import { WinstonInterceptor } from './config/winston.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/all-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Определяем окружение
  const isProduction = process.env.NODE_ENV === 'production';

  // Базовая конфигурация Helmet
  app.use(
    helmet({
      // Временно отключаем CSP - чтобы не сломать Swagger
      contentSecurityPolicy: isProduction
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

      xXssProtection: true, // Включаем XSS защиту
      hidePoweredBy: true, // Скрывает X-Powered-By
      frameguard: { action: 'sameorigin' }, // Защита от clickjacking
      hsts: isProduction
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false, // Отключаем в development
      ieNoOpen: true, // Защита для IE
      noSniff: true, // Запрещает MIME-sniffing
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // Устанавливаем глобальный префикс для всего API (по ТЗ)
  // Теперь все роуты будут начинаться с /api (например, /api/auth/login)
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Удаляет поля, которых нет в DTO
      forbidNonWhitelisted: true, // Ошибка, если прислали лишнее поле
      transform: true, // Автоматическая типизация данных
    }),
  );

  app.useGlobalInterceptors(new WinstonInterceptor());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  // Настройка Swagger
  const configSwagger = new DocumentBuilder()
    .setTitle('SkillSwap API')
    .setDescription('Платформа для обмена навыками')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);

  // Подключаем Swagger по адресу /api/docs
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalFilters(new AllExceptionsFilter());

  const configService = app.get(ConfigService);
  const appConfigData = configService.get<AppConfig>('APP_CONFIG');
  await app.listen(appConfigData?.port ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Ошибка при запуске приложения:', err);
  process.exit(1); // Завершаем процесс с кодом ошибки
});
