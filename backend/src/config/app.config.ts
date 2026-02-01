import { ConfigType, registerAs } from '@nestjs/config';

export const appConfig = registerAs('APP_CONFIG', () => ({
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  hashSalt: parseInt(process.env.HASH_SALT || '10'),
  clientUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));

export type AppConfig = ConfigType<typeof appConfig>;
