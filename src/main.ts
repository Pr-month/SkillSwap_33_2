import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Подключаем глобальную валидацию
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Удаляет поля, которых нет в DTO
      forbidNonWhitelisted: true, // Ошибка, если прислали лишнее поле
      transform: true, // Автоматическая типизация данных
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Ошибка при запуске приложения:', err);
  process.exit(1); // Завершаем процесс с кодом ошибки
});
