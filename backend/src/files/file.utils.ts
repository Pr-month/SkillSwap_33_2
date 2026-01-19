import { extname } from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
// =========
import * as path from 'path';
// =========
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

/**
 * Удаляет файл из папки uploads
 * @param filename - имя файла (например: "abc123.jpg")
 * @returns true если файл удален, false если файл не найден
 */
export const deleteFile = (filename: string): boolean => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Ошибка при удалении файла:', error);
    return false;
  }
};

/**
 * Удаляет файлы по их URL путям
 * @param imageUrls - массив URL (например: ["/uploads/abc123.jpg", "/uploads/def456.png"])
 */
export const deleteFilesByUrls = (imageUrls: string[]): void => {
  imageUrls.forEach((imageUrl) => {
    try {
      // Извлекаем имя файла из URL
      const filename = path.basename(imageUrl);
      deleteFile(filename);
    } catch (error) {
      console.error(`Не удалось удалить файл: ${imageUrl}`, error);
    }
  });
};
