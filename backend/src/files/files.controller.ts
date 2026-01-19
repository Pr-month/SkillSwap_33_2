import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FilesService } from './files.service';
import {
  validateFile,
  generateRandomFilename,
  ensureUploadDirectoryExists,
} from './file.utils';
import { MAX_FILE_SIZE, UPLOAD_PATH } from './file.constants';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * Обрабатывает загрузку файла с валидацией MIME-типа, расширения и размера
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_req, file, callback) => {
        if (!validateFile(file.mimetype, file.originalname)) {
          return callback(
            new BadRequestException(
              'Недопустимый формат файла. Разрешены: jpg, jpeg, png, gif, webp, avif',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          ensureUploadDirectoryExists(UPLOAD_PATH);
          callback(null, UPLOAD_PATH);
        },
        filename: (_req, file, callback) => {
          callback(null, generateRandomFilename(file.originalname));
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }
    return this.filesService.createFileResponse(file);
  }
}
