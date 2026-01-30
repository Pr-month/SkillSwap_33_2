import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateRequestDto } from '../requests/dto/create-request.dto';
import { UpdateRequestDto } from '../requests/dto/update-request.dto';
import { Request } from '../requests/entities/request.entity';
import { RequestStatus } from '../requests/request-status.enum';

// Декоратор для всего контроллера
export function ApiRequests() {
  return applyDecorators(
    ApiTags('Запросы на обмен навыками'),
    ApiBearerAuth('JWT-auth'),
  );
}

// Декораторы для каждого endpoint

export function ApiCreateRequest() {
  return applyDecorators(
    ApiOperation({ summary: 'Создать новый запрос на обмен' }),
    ApiResponse({
      status: 201,
      description: 'Запрос успешно создан',
      type: Request,
    }),
    ApiResponse({
      status: 400,
      description: 'Некорректные данные запроса',
    }),
    ApiResponse({
      status: 403,
      description: 'Недостаточно прав для создания запроса',
    }),
    ApiBody({ type: CreateRequestDto }),
  );
}

export function ApiGetIncomingRequests() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить входящие запросы' }),
    ApiResponse({
      status: 200,
      description: 'Список входящих запросов',
      type: [Request],
    }),
  );
}

export function ApiGetOutgoingRequests() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить исходящие запросы' }),
    ApiResponse({
      status: 200,
      description: 'Список исходящих запросов',
      type: [Request],
    }),
  );
}

export function ApiGetRequest() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить запрос по ID' }),
    ApiParam({
      name: 'id',
      description: 'UUID запроса',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Запрос найден',
      type: Request,
    }),
    ApiResponse({
      status: 404,
      description: 'Запрос не найден',
    }),
    ApiResponse({
      status: 403,
      description: 'Нет доступа к запросу',
    }),
  );
}

export function ApiMarkAsRead() {
  return applyDecorators(
    ApiOperation({ summary: 'Отметить запрос как прочитанный' }),
    ApiParam({
      name: 'id',
      description: 'UUID запроса',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Запрос отмечен как прочитанный',
      type: Request,
    }),
    ApiResponse({
      status: 404,
      description: 'Запрос не найден',
    }),
    ApiResponse({
      status: 403,
      description: 'Нет доступа к запросу',
    }),
  );
}

export function ApiAcceptRequest() {
  return applyDecorators(
    ApiOperation({ summary: 'Принять запрос на обмен' }),
    ApiParam({
      name: 'id',
      description: 'UUID запроса',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Запрос принят',
      type: Request,
    }),
    ApiResponse({
      status: 404,
      description: 'Запрос не найден',
    }),
    ApiResponse({
      status: 403,
      description: 'Нет доступа к запросу',
    }),
    ApiResponse({
      status: 400,
      description: 'Невозможно принять запрос (неверный статус и т.д.)',
    }),
  );
}

export function ApiRejectRequest() {
  return applyDecorators(
    ApiOperation({ summary: 'Отклонить запрос на обмен' }),
    ApiParam({
      name: 'id',
      description: 'UUID запроса',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Запрос отклонен',
      type: Request,
    }),
    ApiResponse({
      status: 404,
      description: 'Запрос не найден',
    }),
    ApiResponse({
      status: 403,
      description: 'Нет доступа к запросу',
    }),
    ApiResponse({
      status: 400,
      description: 'Невозможно отклонить запрос (неверный статус и т.д.)',
    }),
  );
}

export function ApiDeleteRequest() {
  return applyDecorators(
    ApiOperation({ summary: 'Удалить запрос' }),
    ApiParam({
      name: 'id',
      description: 'UUID запроса',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 204,
      description: 'Запрос успешно удален',
    }),
    ApiResponse({
      status: 404,
      description: 'Запрос не найден',
    }),
    ApiResponse({
      status: 403,
      description: 'Нет прав для удаления запроса',
    }),
  );
}

export function ApiUpdateRequest() {
  return applyDecorators(
    ApiOperation({ summary: 'Обновить запрос' }),
    ApiParam({
      name: 'id',
      description: 'UUID запроса',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Запрос обновлен',
      type: Request,
    }),
    ApiResponse({
      status: 404,
      description: 'Запрос не найден',
    }),
    ApiResponse({
      status: 403,
      description: 'Нет доступа к запросу',
    }),
    ApiResponse({
      status: 400,
      description: 'Некорректные данные для обновления',
    }),
    ApiBody({ type: UpdateRequestDto }),
  );
}

// Вспомогательные декораторы для DTO
export function ApiRequestStatus() {
  return applyDecorators(
    ApiParam({
      name: 'status',
      description: 'Статус запроса',
      enum: RequestStatus,
      example: RequestStatus.PENDING,
    }),
  );
}
