import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { Server } from 'http';
import { AppModule } from '../src/app.module';
import { NotificationPayload } from '../src/notification/guards/ws-types';
import { wsConfig } from '../src/config/ws.config';
import { Tokens } from '../src/auth/types';
import { Skill } from '../src/skills/entities/skill.entity';
import { User } from '../src/users/entities/user.entity';

describe('Notification E2E (WebSocket)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let wsUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.init();

    httpServer = app.getHttpServer() as Server;

    const WS_PORT = Number(wsConfig().port);
    wsUrl = `http://localhost:${WS_PORT}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should deliver "notificateNewRequest" notification via WebSocket when a request is created', async () => {
    // Регистрация получателя
    const recipientEmail = `recipient_${Date.now()}@test.com`;
    const recipientRes = await request(httpServer)
      .post('/auth/register')
      .send({
        email: recipientEmail,
        password: 'password123',
        name: 'Recipient User',
        birthdate: '1990-01-01',
        gender: 'male',
        city: 'Test City',
        about: 'I am a master of tests',
      })
      .expect(201);

    const recipientData = recipientRes.body as unknown as Tokens & User;
    const recipientToken = recipientData.accessToken;

    // Регистрация отправителя
    const senderEmail = `sender_${Date.now()}@test.com`;
    const senderRes = await request(httpServer)
      .post('/auth/register')
      .send({
        email: senderEmail,
        password: 'password123',
        name: 'Sender User',
        birthdate: '1995-05-05',
        gender: 'female',
        city: 'Test City',
        about: 'I want to learn tests',
      })
      .expect(201);

    const senderData = senderRes.body as unknown as Tokens & User;
    const senderToken = senderData.accessToken;
    const senderName = senderData.name;

    // Получатель создаёт навык
    const skillRes = await request(httpServer)
      .post('/skills')
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({ title: 'Testing Skill', description: 'E2E Test Description' })
      .expect(201);

    const skillData = skillRes.body as unknown as Skill;
    const skillId = skillData.id;
    const skillName = skillData.title;

    // Подключение WebSocket
    const socket: Socket = io(wsUrl, {
      query: { token: recipientToken },
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => resolve());
      socket.on('connect_error', (err: Error) =>
        reject(new Error(`WS connection failed: ${err.message}`)),
      );
      setTimeout(() => reject(new Error('WS connection timeout')), 5000);
    });

    // !!! ВАЖНО: Даем серверу время (1 сек) на выполнение handleConnection (join room),
    // прежде чем отправлять запрос, который вызовет уведомление.
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Для отладки: если придет хоть какое-то событие, выведем его
    socket.onAny((event, ...args) => {
      console.log('Received WS event:', event, args);
    });

    // Тест сценария
    const [notificationResponse] = await Promise.all([
      new Promise<NotificationPayload>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Notification timed out'));
        }, 10000);

        socket.once('notificateNewRequest', (data: unknown) => {
          clearTimeout(timeout);
          resolve(data as NotificationPayload);
        });
      }),

      request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: recipientId,
          offeredSkillId,
          requestedSkillId,
        })
        .expect(201),
    ]);

    // Проверки
    expect(notificationResponse).toEqual(
      expect.objectContaining({
        type: 'new_request',
        skillName: skillName,
        fromUser: senderName,
        timestamp: expect.any(String) as unknown as Date,
      }),
    );

    socket.disconnect();
  }, 30000);
});
