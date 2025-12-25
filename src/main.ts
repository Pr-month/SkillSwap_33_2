import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config/app.config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
