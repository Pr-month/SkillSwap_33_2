import { ConfigType, registerAs } from '@nestjs/config';

export const mailConfig = registerAs('MAIL_CONFIG', () => ({
  host: process.env.MAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.MAIL_PORT || '465', 10),
  secure: process.env.MAIL_SECURE !== 'false',
  auth: {
    user: process.env.MAIL_USER || 'noreply@example.com',
    pass: process.env.MAIL_PASSWORD || 'password',
  },
  defaults: {
    from: process.env.MAIL_FROM || '"SkillSwap" <noreply@example.com>',
  },
}));

export type MailConfig = ConfigType<typeof mailConfig>;
