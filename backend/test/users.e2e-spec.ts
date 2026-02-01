import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { ResGetUsersDto } from '../src/users/dto/res-get-users.dto';
import { Reflector } from '@nestjs/core';
import { AllExceptionsFilter } from '../src/common/all-exception.filter';
import { v4 as uuidv4 } from 'uuid';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let accessToken: string;
  let testUsers: User[];
  // let categories: Category[]; - для тестов api/users/by-skill/:id

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        JwtModule.register({
          secret: process.env.JWT_ACCESS_TOKEN || 'access_secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    ); //Убираем поля, которые не должны возвращаться
    app.useGlobalPipes(
      //Валидация
      new ValidationPipe({
        whitelist: true, // Удаляет поля, которых нет в DTO
        forbidNonWhitelisted: true, // Ошибка, если прислали лишнее поле
        transform: true, // Автоматическая типизация данных
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    const userRepository = dataSource.getRepository(User);
    // const categoriesRepository = dataSource.getRepository(Category); - - для тестов api/users/by-skill/:id

    testUsers = await userRepository.find();
    // categories = await categoriesRepository.find(); - для тестов api/users/by-skill/:id

    if (testUsers.length === 0) {
      throw new Error('В базе данных нет пользователей для тестирования');
    }

    accessToken = jwtService.sign({
      sub: testUsers[0].id,
      email: testUsers[0].email,
      role: testUsers[0].role,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET запросы', () => {
    it('GET /users должен вернуть список пользователей со стандартной пангинацией', async () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .expect(200)
        .expect((res) => {
          const response = res.body as ResGetUsersDto;

          expect(response.data).toBeDefined();
          expect(response.meta).toBeDefined();
          expect(Array.isArray(response.data)).toBe(true);
          expect(response.data.length).toBeLessThanOrEqual(10);
          expect(response.meta.total).toBeGreaterThanOrEqual(testUsers.length);
          expect(response.meta.page).toBe(1);
          expect(response.meta.limit).toBe(10);

          if (response.data.length > 0) {
            const user = response.data[0];
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('email');
            expect(user).not.toHaveProperty('password');
          }
        });
    });

    it('GET /users:id должен получить пользователя по id', async () => {
      const testUser = testUsers[0];
      return request(app.getHttpServer())
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const user = res.body as User;
          expect(user.id).toBe(testUser.id);
          expect(user.email).toBe(testUser.email);
          expect(user).not.toHaveProperty('password');
        });
    });

    it('GET /users:id должен вернуть ошибку 404 для несуществующего пользователя', async () => {
      const nonExistentId = '00000000000000000000000000000000';

      return request(app.getHttpServer())
        .get(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('GET /users:id должен вернуть 401 на запрос пользователя без токена', async () => {
      const testUser = testUsers[0];

      return request(app.getHttpServer())
        .get(`/api/users/${testUser.id}`)
        .expect(401);
    });

    it('GET /users/me должен вернуть текущего пользователя', async () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const user = res.body as User;
          expect(user.id).toBe(testUsers[0].id);
          expect(user.email).toBe(testUsers[0].email);
        });
    });

    it('GET /users/me должен вернуть 401 без токена', async () => {
      return request(app.getHttpServer()).get('/api/users/me').expect(401);
    });

    // it('GET by-skill/:id должен вернуть список пользователей с указанным навыком', async () => {
    //   const skillId = categories[0].id; //  - для тестов api/users/by-skill/:id
    //   return request(app.getHttpServer())
    //     .get(`/api/users/by-skill/${skillId}`)
    //     .set('Authorization', `Bearer ${accessToken}`)
    //     .expect(200);
    // });
  });

  describe('PATCH запросы', () => {
    it('PATCH /users/me должен обновить текущего пользователя', async () => {
      const testUser = testUsers[0];
      const updateData = { name: 'Updated Name', birthdate: '1990-01-01' };
      const response = await request(app.getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      const updatedUser = response.body as User;
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.birthdate).toBe(updateData.birthdate);
      expect(updatedUser.id).toBe(testUser.id);
    });

    it('PATCH /users/me должен вернуть 401 без токена', async () => {
      const updateData = { name: 'Updated Name' };
      return request(app.getHttpServer())
        .patch('/api/users/me')
        .send(updateData)
        .expect(401);
    });

    it('PATCH /users/me должен вернуть 400 если некорректные данные для обновления', async () => {
      const updateData = { email: ' ' };
      return request(app.getHttpServer())
        .patch('/api/users/me')
        .send(updateData)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('PATCH /users/me/password изменить пароль текущего пользователя', async () => {
      const updateData = {
        newPassword: 'UrzogGroDrollForever2026!',
      };

      const response = await request(app.getHttpServer())
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
    });

    it('PATCH /users/me/password должен вернуть 400 для некорректных данных', async () => {
      const updateData = {
        newPassword: ' ',
      };

      return request(app.getHttpServer())
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);
    });

    it('PATCH /users/me/password должен вернуть 401 если пользователь не авторизован', async () => {
      const updateData = {
        newPassword: 'UrzogGroDroll2026!',
      };

      return request(app.getHttpServer())
        .patch('/api/users/me/password')
        .send(updateData)
        .expect(401);
    });

    it('PATCH /users/me/password должен вернуть 404 если пользователь не найден', async () => {
      const nonExistentUserId = uuidv4();

      const nonExistentUserToken = jwtService.sign({
        sub: nonExistentUserId,
        email: 'nonexistent@example.com',
        role: 'user',
      });

      const updateData = {
        newPassword: 'UrzogGroDroll2026!',
      };

      return request(app.getHttpServer())
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${nonExistentUserToken}`)
        .send(updateData)
        .expect(404);
    });
  });
});
