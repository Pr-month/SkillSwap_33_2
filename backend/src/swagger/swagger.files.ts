import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileUploadDto } from 'src/files/dto/file-upload.dto';

export const ApiFilesTag = () => applyDecorators(ApiTags('Files'));

// POST /upload
export const ApiUploadFile = () =>
  applyDecorators(
    ApiOperation({ summary: 'Загрузить изображение' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      required: true,
      type: 'multipart/form-data',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Изображение успешно загружено',
      type: FileUploadDto,
    }),
    ApiBadRequestResponse({
      description:
        'Недопустимый формат файла. Разрешены: jpg, jpeg, png, gif, webp, avif',
    }),
    ApiBadRequestResponse({
      description: 'Файл не был загружен',
    }),
  );
