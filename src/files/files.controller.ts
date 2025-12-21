import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { FilesService } from './files.service';

// Белый список форматов
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Недопустимый формат файла. Разрешены: jpeg, png, gif, webp, avif',
            ),
            false,
          );
        }

        cb(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadPath = './public/uploads';

          // Создаем папку, если ее нет
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }

          cb(null, uploadPath);
        },
        filename: (_req, file, cb) => {
          // Генерируем случайное имя (16 байт hex)
          const randomName = crypto.randomBytes(16).toString('hex');
          const extension = extname(file.originalname).toLowerCase();

          cb(null, `${randomName}${extension}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }

    return this.filesService.createFileResponse(file);
  }
}
