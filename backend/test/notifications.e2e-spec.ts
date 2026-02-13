import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Server } from 'http';
import { AppModule } from '../src/app.module';
import { Tokens } from '../src/auth/types';
import { Skill } from '../src/skills/entities/skill.entity';
import { User } from '../src/users/entities/user.entity';
import { NotificationsGateway } from '../src/notification/notifications.gateway';

describe('Notification E2E (упрощенный)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NotificationsGateway)
      .useValue({
        notifyUser: jest.fn(), // Мок метода
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a request successfully', async () => {
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

    // Получатель создаёт навык
    const skillRes = await request(httpServer)
      .post('/skills')
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({ title: 'Testing Skill', description: 'E2E Test Description' })
      .expect(201);

    const skillData = skillRes.body as unknown as Skill;
    const requestedSkillId = skillData.id;

    // Отправитель создаёт навык для предложения
    const offeredSkillRes = await request(httpServer)
      .post('/skills')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ title: 'Offered Skill', description: 'Skill I can offer' })
      .expect(201);

    const offeredSkillData = offeredSkillRes.body as unknown as Skill;
    const offeredSkillId = offeredSkillData.id;

    // Создаем запрос на обмен
    const requestRes = await request(httpServer)
      .post('/requests')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        offeredSkill: { id: offeredSkillId },
        requestedSkill: { id: requestedSkillId },
      });

    console.log(
      'Request creation response:',
      requestRes.status,
      requestRes.body,
    );

    // Ожидаем успешное создание (201) или хотя бы не 500
    expect(requestRes.status).toBe(201);
  }, 30000);
});
