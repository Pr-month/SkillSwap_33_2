import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config/app.config';
import { ValidationPipe } from '@nestjs/common';
import { WinstonInterceptor } from './config/winston.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/all-exception.filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // TODO: Настроить FRONTEND_URL в .env
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // Разрешаем cookies для CSRF
  });

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
    .setDescription(
      `Платформа для обмена навыками

  ## CSRF Защита
  
  Для всех модифицирующих запросов (POST, PUT, PATCH, DELETE) требуется CSRF токен.
  
  ### Как использовать:
  1. Получите CSRF токен: \`GET /api/auth/csrf-token\`
  2. Добавьте токен в заголовок: \`X-CSRF-Token: ваш-токен\`
  3. Для запросов, требующих авторизации, также добавьте JWT токен
  
  ### Исключения:
  - GET, HEAD, OPTIONS запросы не требуют CSRF
  - Публичные endpoints: /api/auth/login, /api/auth/register, /api/auth/refresh
  - Swagger документация (/api/docs)
  `,
    )
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
