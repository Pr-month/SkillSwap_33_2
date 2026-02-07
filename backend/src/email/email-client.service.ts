/* eslint-disable */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  group?: string;
}

interface EmailResponse {
  success: boolean;
  message?: string;
}

@Injectable()
export class EmailClientService {
  private readonly logger = new Logger(EmailClientService.name);
  private readonly emailServiceUrl: string;

  constructor(private configService: ConfigService) {
    const host = this.configService.get('EMAIL_SERVICE_HOST', 'localhost');
    const port = this.configService.get('EMAIL_SERVICE_PORT', '3001');
    this.emailServiceUrl = `http://${host}:${port}`;
    this.logger.log(`Email service URL: ${this.emailServiceUrl}`);
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const response = await fetch(`${this.emailServiceUrl}/mail/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: EmailResponse = await response.json();
      return data.success === true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to send email: ${err.message}`);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.emailServiceUrl}/mail/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: EmailResponse = await response.json();
      return data.success === true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Email service test failed: ${err.message}`);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Добро пожаловать в SkillSwap!',
      html: `
        <h1>Добро пожаловать, ${name}!</h1>
        <p>Спасибо за регистрацию в SkillSwap.</p>
        <p>Начните обмен навыками уже сегодня!</p>
      `,
      group: 'group2',
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Восстановление пароля SkillSwap',
      html: `
        <h1>Восстановление пароля</h1>
        <p>Для восстановления пароля перейдите по ссылке:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Ссылка действительна 1 час.</p>
      `,
      group: 'group2',
    });
  }
}