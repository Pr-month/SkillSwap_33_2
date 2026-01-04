import dotenv from 'dotenv';
import { AppDataSource } from '../src/config/db.config';

export default async function globalSetup() {
  // Загружаем .env.test.local
  dotenv.config({ path: '.env.test.local' });

  // Инициализируем подключение
  await AppDataSource.initialize();

  // Очищаем все таблицы
  await AppDataSource.dropDatabase();

  // Воссоздаём схему через synchronize (т.к. миграций нет)
  await AppDataSource.synchronize();
}
