import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateSkillDto } from '../skills/dto/create-skill.dto';
import { UpdateSkillDto } from '../skills/dto/update-skill.dto';
import { Skill } from '../skills/entities/skill.entity';

export const ApiSkillsTag = () => applyDecorators(ApiTags('Skills'));

// POST /skills
export const ApiCreateSkill = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Создать новый навык' }),
    ApiBody({ type: CreateSkillDto, required: true }),
    ApiCreatedResponse({
      description: 'Навык успешно создан',
      type: Skill,
    }),
    ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' }),
    ApiNotFoundResponse({
      description: 'Категория с указанным ID не найдена',
    }),
  );

// GET /skills/:id
export const ApiFindOneSkill = () =>
  applyDecorators(
    ApiOperation({ summary: 'Получить навык по ID' }),
    ApiParam({
      name: 'id',
      description: 'ID навыка',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiOkResponse({
      description: 'Навык найден',
      type: Skill,
    }),
    ApiNotFoundResponse({ description: 'Навык не найден' }),
  );

// DELETE /skills/:id
export const ApiRemoveSkill = () =>
  applyDecorators(
    ApiOperation({ summary: 'Удалить навык' }),
    ApiParam({
      name: 'id',
      description: 'ID навыка',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiOkResponse({
      description: 'Навык успешно удален',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Skill deleted successfully' },
        },
      },
    }),
    ApiNotFoundResponse({ description: 'Навык не найден' }),
  );

// GET /skills
export const ApiFindSkills = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Получить список навыков с пагинацией',
      description:
        'Возвращает список навыков с поддержкой пагинации и сортировки',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Номер страницы (по умолчанию: 1)',
      type: 'number',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description:
        'Количество записей на странице (по умолчанию: 20, максимум: 100)',
      type: 'number',
      example: 20,
    }),
    ApiQuery({
      name: 'order',
      required: false,
      description: 'Порядок сортировки по дате обновления',
      enum: ['ASC', 'DESC'],
      example: 'DESC',
    }),
    ApiOkResponse({
      description: 'Список навыков успешно получен',
      type: [Skill],
    }),
    ApiNotFoundResponse({ description: 'Страница не найдена' }),
  );

// PATCH /skills/:id
export const ApiUpdateSkill = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Обновить навык',
      description:
        'Обновляет данные навыка. Только владелец навыка может его обновить',
    }),
    ApiParam({
      name: 'id',
      description: 'ID навыка',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      type: UpdateSkillDto,
      required: true,
      description: 'Данные для обновления навыка',
    }),
    ApiOkResponse({
      description: 'Навык успешно обновлен',
      type: Skill,
    }),
    ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' }),
    ApiNotFoundResponse({ description: 'Навык не найден' }),
    ApiResponse({
      status: 403,
      description: 'Пользователь не является владельцем навыка',
    }),
  );

// DELETE /skills/:id/favorites
export const ApiRemoveFromFavorites = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Удалить навык из избранного',
      description: 'Удаляет навык из списка избранных текущего пользователя',
    }),
    ApiParam({
      name: 'id',
      description: 'ID навыка',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiNoContentResponse({
      description: 'Навык успешно удален из избранного',
    }),
    ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' }),
    ApiNotFoundResponse({
      description: 'Навык не найден или не находится в избранном',
    }),
  );

// POST /skills/:id/favorites
export const ApiAddToFavorites = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Добавить навык в избранное',
      description: 'Добавляет навык в список избранных текущего пользователя',
    }),
    ApiParam({
      name: 'id',
      description: 'ID навыка',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiCreatedResponse({
      description: 'Навык успешно добавлен в избранное',
      type: Skill,
    }),
    ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' }),
    ApiNotFoundResponse({ description: 'Навык или пользователь не найден' }),
    ApiResponse({
      status: 409,
      description: 'Навык уже находится в избранном',
    }),
  );
