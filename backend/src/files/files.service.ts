import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
  /**
   * Формирует ответ клиенту после успешной загрузки файла
   */
  createFileResponse(file: Express.Multer.File) {
    return {
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
