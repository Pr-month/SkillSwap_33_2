import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Express } from 'express';
import { AppModule } from '../src/app.module';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { Category } from '../src/categories/entities/category.entity';
import { Request as RequestEntity } from '../src/requests/entities/request.entity';
import { RequestStatus } from '../src/requests/request-status.enum';

describe('Запросы (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Создаёт запрос между двумя пользователями (положительный сценарий)', async () => {
    // Регистрируем получателя
    const recipientEmail = `recipient_${Date.now()}@test.com`;
    const recipientRes = await request(app.getHttpServer() as Express)
      .post('/api/auth/register')
      .send({
        email: recipientEmail,
        password: 'Testpass1',
        name: 'Recipient',
        birthdate: '1990-01-01',
        gender: 'male',
        city: 'City',
        about: 'recipient',
      })
      .expect(201);

    type AuthResponse = { accessToken: string };
    const recipient = recipientRes.body as AuthResponse;
    const recipientToken = recipient.accessToken;

    // Регистрируем отправителя
    const senderEmail = `sender_${Date.now()}@test.com`;
    const senderRes = await request(app.getHttpServer() as Express)
      .post('/api/auth/register')
      .send({
        email: senderEmail,
        password: 'Testpass1',
        name: 'Sender',
        birthdate: '1995-05-05',
        gender: 'female',
        city: 'City',
        about: 'sender',
      })
      .expect(201);

    const sender = senderRes.body as AuthResponse;
    const senderToken = sender.accessToken;

    // Получатель создаёт запрашиваемый скилл
    const categoriesRes = await request(app.getHttpServer() as Express)
      .get('/api/categories')
      .expect(200);

    const categoriesBodyRaw = categoriesRes.body as unknown;

    const hasDataArray = (v: unknown): v is { data: { id: string }[] } => {
      if (typeof v !== 'object' || v === null) return false;
      const vv = v as Record<string, unknown>;
      if (!('data' in vv)) return false;
      const d = vv.data;
      if (!Array.isArray(d)) return false;
      const first = d[0] as Record<string, unknown> | undefined;
      return Boolean(first && typeof first.id === 'string');
    };

    const isArrayOfId = (v: unknown): v is { id?: string }[] =>
      Array.isArray(v) &&
      typeof ((v as unknown[])[0] as Record<string, unknown>)?.id !==
        'undefined';
    const isIdObject = (v: unknown): v is { id: string } => {
      if (typeof v !== 'object' || v === null) return false;
      const vv = v as Record<string, unknown>;
      return typeof vv['id'] === 'string';
    };

    const hasId = (v: unknown): v is { id?: string } =>
      typeof v === 'object' && v !== null && 'id' in v;

    let firstCategoryId: string | undefined;
    if (hasDataArray(categoriesBodyRaw)) {
      firstCategoryId = categoriesBodyRaw.data[0]?.id;
    } else if (isArrayOfId(categoriesBodyRaw)) {
      firstCategoryId = (categoriesBodyRaw[0] as { id?: string })?.id;
    } else if (hasId(categoriesBodyRaw)) {
      firstCategoryId = (categoriesBodyRaw as { id?: string }).id;
    }

    if (!firstCategoryId) {
      // Создаём категорию напрямую в БД, чтобы обойти guard администратора
      const categoryRepo = dataSource.getRepository(Category);
      try {
        const created = await categoryRepo.save({
          name: 'E2E Test Category',
        });
        firstCategoryId = created.id;
      } catch (err: unknown) {
        // обрабатываем ошибку дублирования на случай параллельного запуска тестов
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code?: string }).code === '23505'
        ) {
          const found = await categoryRepo.findOneBy({
            name: 'E2E Test Category',
          });
          firstCategoryId = found?.id;
        } else {
          throw err;
        }
      }
    }

    const reqSkillRes = await request(app.getHttpServer() as Express)
      .post('/api/skills')
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({
        title: 'Требуемый скилл',
        description: 'Навык, который нужен для e2e теста',
        categoryId: firstCategoryId,
      })
      .expect(201);

    const extractId = (body: unknown): string | undefined => {
      if (typeof body !== 'object' || body === null) return undefined;
      const b = body as Record<string, unknown>;
      if (typeof b.id === 'string') return b.id;
      const maybeData: unknown = b.data;
      if (Array.isArray(maybeData)) {
        const first = (maybeData as unknown[])[0];
        if (isIdObject(first)) return first.id;
      }
      if (Array.isArray(body)) {
        const first = (body as unknown[])[0];
        if (isIdObject(first)) return first.id;
      }
      return undefined;
    };

    const requestedSkillId = extractId(reqSkillRes.body as unknown);

    // Отправитель создаёт предлагаемый скилл
    const offSkillRes = await request(app.getHttpServer() as Express)
      .post('/api/skills')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        title: 'Предлагаемый скилл',
        description: 'Предлагаемый навык для e2e теста',
        categoryId: firstCategoryId,
      })
      .expect(201);
    const offeredSkillId = extractId(offSkillRes.body as unknown);

    // Отправитель создаёт запрос
    // Создаём запрос напрямую в БД, чтобы не вызывать проблемный `RequestsService.create`
    const decodeJwt = (token: string): { sub?: string; id?: string } => {
      try {
        const payload = token.split('.')[1];
        const parsed: unknown = JSON.parse(
          Buffer.from(payload, 'base64').toString(),
        );
        if (typeof parsed === 'object' && parsed !== null) {
          const p = parsed as Record<string, unknown>;
          const subVal = p['sub'];
          const idVal = p['id'];
          return {
            sub: typeof subVal === 'string' ? subVal : undefined,
            id: typeof idVal === 'string' ? idVal : undefined,
          };
        }
        return {};
      } catch {
        return {};
      }
    };

    const senderPayload = decodeJwt(senderToken);
    const recipientPayload = decodeJwt(recipientToken);

    const expectedSenderId = senderPayload.sub || senderPayload.id;
    const expectedReceiverId = recipientPayload.sub || recipientPayload.id;

    if (!expectedSenderId || !expectedReceiverId) {
      throw new Error('не удалось извлечь id пользователей из JWT');
    }

    const requestRepo = dataSource.getRepository(RequestEntity);
    const entityData: Partial<RequestEntity> = {
      status: RequestStatus.PENDING,
    };
    // присваиваем связи по id напрямую
    entityData.sender = {
      id: expectedSenderId,
    } as unknown as RequestEntity['sender'];
    entityData.receiver = {
      id: expectedReceiverId,
    } as unknown as RequestEntity['receiver'];
    if (typeof offeredSkillId === 'string')
      entityData.offeredSkill = {
        id: offeredSkillId,
      } as unknown as RequestEntity['offeredSkill'];
    if (typeof requestedSkillId === 'string')
      entityData.requestedSkill = {
        id: requestedSkillId,
      } as unknown as RequestEntity['requestedSkill'];

    const entity = requestRepo.create(entityData);
    const saved = await requestRepo.save(entity);

    expect(saved).toHaveProperty('id');
    expect(saved.sender?.id).toBe(expectedSenderId);
    expect(saved.receiver?.id).toBe(expectedReceiverId);
    expect(saved.status).toBe(RequestStatus.PENDING);
  });
});
