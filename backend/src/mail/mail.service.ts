import { Injectable, Inject } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MailConfig, mailConfig } from '../config/mail.config';

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(@Inject(mailConfig.KEY) private config: MailConfig) {
    const { host, port, secure, auth } = this.config;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: auth.user, pass: auth.pass },
      tls:
        process.env.NODE_ENV !== 'production'
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }

  async send(payload: EmailPayload): Promise<void> {
    const { from } = this.config.defaults;
    await this.transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    });
  }
}
