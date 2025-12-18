import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
  createFileResponse(file: Express.Multer.File) {
    // Формируем ответ для клиента
    return {
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
