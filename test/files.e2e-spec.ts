import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { join } from 'path';
import { rmSync, existsSync } from 'fs';
import { Server } from 'net';
import { FilesModule } from '../src/files/files.module';
import { UPLOAD_PATH, MAX_FILE_SIZE } from '../src/files/file.constants';

/**
 * E2E-тесты для модуля загрузки файлов
 * Проверяют интеграцию Multer + FilesController
 */
describe('FilesController (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  // Очищаем тестовое окружение перед запуском
  beforeAll(() => {
    try {
      rmSync(UPLOAD_PATH, { recursive: true, force: true });
    } catch {
      // Игнорируем ошибку, если папки не было
    }
  });

  afterAll(async () => app?.close());

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FilesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    server = app.getHttpServer() as Server;
  });

  it('should successfully upload a valid PNG image', async () => {
    const response = await request(server)
      .post('/api/files/upload')
      .attach('file', Buffer.from('fake png content'), 'photo.png')
      .expect(201);

    expect(response.body).toEqual({
      // Приводим к unknown для совместимости с типами Jest matchers
      url: expect.stringMatching(/^\/uploads\/[a-f0-9]{32}\.png$/) as unknown,
      name: 'photo.png',
      mimeType: 'image/png',
      size: expect.any(Number) as unknown,
    });

    // Убеждаемся, что файл физически создан на диске
    const responseBody = response.body as { url: string };
    const filename = responseBody.url.split('/').pop() as string;
    const filePath = join(process.cwd(), UPLOAD_PATH, filename);

    expect(existsSync(filePath)).toBe(true);
  });

  it('should reject file with disallowed extension (.exe)', async () => {
    await request(server)
      .post('/api/files/upload')
      .attach('file', Buffer.from('fake exe'), 'malware.exe')
      .expect(400);
  });

  it('should reject file with disallowed MIME type (text/plain)', async () => {
    await request(server)
      .post('/api/files/upload')
      .attach('file', Buffer.from('text content'), 'notes.txt')
      .expect(400);
  });

  it('should reject file with valid MIME type but invalid extension', async () => {
    const fakeFile = Buffer.from('fake content');

    await request(server)
      .post('/api/files/upload')
      .attach('file', fakeFile, {
        filename: 'virus.exe', // Расширение запрещено
        contentType: 'image/jpeg', // MIME разрешен (попытка обмана)
      })
      .expect(400);
  });

  it('should reject file larger than limit', async () => {
    const largeFile = Buffer.alloc(MAX_FILE_SIZE + 1); // + 1 byte

    await request(server)
      .post('/api/files/upload')
      .attach('file', largeFile, 'large.jpg')
      .expect((res) => {
        if (res.status !== 400 && res.status !== 413) {
          throw new Error(`Expected 400 or 413, got ${res.status}`);
        }
      });
  });

  it('should reject request without file', async () => {
    await request(server).post('/api/files/upload').expect(400);
  });
});
