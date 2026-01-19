import { ConfigType, registerAs } from '@nestjs/config';

export const wsConfig = registerAs('WS_CONFIG', () => ({
  port: process.env.WS_NOTIFICATIONS_PORT || 4000,
}));

export type WsConfig = ConfigType<typeof wsConfig>;
