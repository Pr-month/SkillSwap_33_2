import { ConfigType, registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('JWT_CONFIG', () => ({
  accessToken: process.env.JWT_ACCESS_TOKEN || 'access_secret',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',

  refreshToken: process.env.JWT_REFRESH_TOKEN || 'refresh_secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export type JwtConfig = ConfigType<typeof jwtConfig>;
