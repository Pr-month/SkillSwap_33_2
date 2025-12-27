import { extname } from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS } from './file.constants';

/**
 * Проверяет соответствие MIME-типа и расширения файла белым спискам
 */
export const validateFile = (
  mimetype: string,
  originalname: string,
): boolean => {
  const hasValidMime = ALLOWED_MIME_TYPES.has(mimetype);
  const hasValidExt = ALLOWED_EXTENSIONS.has(
    extname(originalname).toLowerCase(),
  );
  return hasValidMime && hasValidExt;
};

/**
 * Генерирует уникальное имя файла: 32-символьный hex + оригинальное расширение
 */
export const generateRandomFilename = (originalname: string): string => {
  const randomName = crypto.randomBytes(16).toString('hex');
  const extension = extname(originalname).toLowerCase();
  return `${randomName}${extension}`;
};

/**
 * Создаёт директорию для загрузки, если она не существует
 */
export const ensureUploadDirectoryExists = (uploadPath: string): void => {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
};
