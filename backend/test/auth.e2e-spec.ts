import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  const genEmail = () => `testuser+${Date.now()}@example.com`;
  const testUser = {
    name: 'Test User',
    about: 'Test about',
    birthdate: '2000-01-01',
    city: 'Москва',
    gender: 'male',
    email: '',
    password: 'Testpass1',
  };
  let registeredUser: { email: string; password: string };

  beforeEach(async () => {
    const user = { ...testUser, email: genEmail() };
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);
    registeredUser = { email: user.email, password: user.password };
  });

  it('/auth/register (POST) — регистрация', async () => {
    const user = { ...testUser, email: genEmail() };
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('/auth/login (POST) — логин', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(registeredUser)
      .expect(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('/auth/refresh (POST) — обновление токена', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send(registeredUser)
      .expect(200);
    const { refreshToken } = loginRes.body as { refreshToken: string };
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('/auth/logout (POST) — логаут', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send(registeredUser)
      .expect(200);
    const { refreshToken } = loginRes.body as { refreshToken: string };
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');
  });
});
