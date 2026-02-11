import { Test, TestingModule } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';
import { MailConfig, mailConfig } from '../config/mail.config';

describe('MailService', () => {
  let service: MailService;
  let createTransportSpy: jest.SpyInstance;
  let sendMailMock: jest.MockedFunction<
    (options: nodemailer.SendMailOptions) => Promise<nodemailer.SentMessageInfo>
  >;

  const mockConfig: MailConfig = {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: { user: 'test', pass: 'test' },
    defaults: { from: 'noreply@skillswap.com' },
  };

  beforeEach(async () => {
    sendMailMock = jest
      .fn()
      .mockResolvedValue({} as nodemailer.SentMessageInfo);

    createTransportSpy = jest
      .spyOn(nodemailer, 'createTransport')
      .mockImplementation(
        () =>
          ({
            sendMail: sendMailMock,
          }) as unknown as ReturnType<typeof nodemailer.createTransport>,
      );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: mailConfig.KEY, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create transporter with correct config', () => {
    expect(createTransportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: { user: 'test', pass: 'test' },
      }),
    );
  });

  describe('send()', () => {
    it('should send email with correct payload', async () => {
      await service.send({
        to: 'user@example.com',
        subject: 'Test',
        text: 'Hello',
      });

      expect(sendMailMock).toHaveBeenCalledWith({
        from: 'noreply@skillswap.com',
        to: 'user@example.com',
        subject: 'Test',
        text: 'Hello',
      });
    });

    it('should reject on transporter error', async () => {
      const error = new Error('SMTP failed');
      sendMailMock.mockRejectedValueOnce(error);

      await expect(
        service.send({ to: 'user@example.com', subject: 'Test', text: 'Hi' }),
      ).rejects.toThrow('SMTP failed');
    });
  });

  describe('TLS configuration', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should set tls to { rejectUnauthorized: false } when not in production', async () => {
      process.env.NODE_ENV = 'development';

      const spy = jest.spyOn(nodemailer, 'createTransport');

      await Test.createTestingModule({
        providers: [
          MailService,
          { provide: mailConfig.KEY, useValue: mockConfig },
        ],
      }).compile();

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          tls: { rejectUnauthorized: false },
        }),
      );
    });

    it('should set tls to undefined in production mode', async () => {
      process.env.NODE_ENV = 'production';

      const spy = jest.spyOn(nodemailer, 'createTransport');

      await Test.createTestingModule({
        providers: [
          MailService,
          { provide: mailConfig.KEY, useValue: mockConfig },
        ],
      }).compile();

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          tls: undefined,
        }),
      );
    });
  });
});
