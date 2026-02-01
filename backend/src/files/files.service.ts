import { Injectable } from '@nestjs/common';
import { FileUploadDto } from './dto/file-upload.dto';

@Injectable()
export class FilesService {
  /**
   * Формирует ответ клиенту после успешной загрузки файла
   */
  createFileResponse(file: Express.Multer.File): FileUploadDto {
    return {
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
