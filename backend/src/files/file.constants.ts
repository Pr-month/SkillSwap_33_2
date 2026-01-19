// Белый список допустимых MIME-типов для загрузки файлов
export const ALLOWED_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

// Белый список допустимых расширений файлов (в нижнем регистре)
export const ALLOWED_EXTENSIONS = new Set<string>([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.avif',
]);

// Максимальный размер файла: 2МБ
export const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Путь к директории для сохранения загруженных файлов
export const UPLOAD_PATH =
  process.env.NODE_ENV === 'test' ? './test_uploads' : './public/uploads';
