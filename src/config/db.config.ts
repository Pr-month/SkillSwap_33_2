import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';

// Загружаем переменные из .env, чтобы они были доступны классу DataSource
dotenvConfig({ path: '.env' });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  // Автоматически искать сущности в папке dist после компиляции
  entities: ['dist/**/*.entity.js'],
  // Путь для миграций
  migrations: ['dist/database/migrations/*.js'],
  // Внимание! В продакшене всегда должно быть false
  synchronize: process.env.POSTGRES_SYNCHRONIZE === 'true',
};

// Экспортируем DataSource для использования в CLI миграций
export const AppDataSource = new DataSource(dataSourceOptions);
