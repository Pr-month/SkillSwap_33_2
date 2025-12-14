import { config as dotenvConfig } from 'dotenv';
import { ConfigType, registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

// Загружаем переменные из .env, чтобы они были доступны классу DataSource
dotenvConfig({ path: '.env' });

export const dbConfig = registerAs(
  'DB_CONFIG',
  (): PostgresConnectionOptions => ({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'skillswap',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    // Путь для миграций
    migrations: ['dist/database/migrations/*.js'],
    synchronize: process.env.NODE_ENV !== 'production',
  }),
);

// Экспортируем тип для использования в useFactory
export type DatabaseConfig = ConfigType<typeof dbConfig>;

// Экспортируем DataSource для использования в CLI миграций
export const AppDataSource = new DataSource(dbConfig() as DataSourceOptions);
