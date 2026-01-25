import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';
import { Category } from '../categories/entities/category.entity';
import { UpdateCategoryDto } from 'src/categories/dto/update-category.dto';

export const ApiCategoriesTag = () => applyDecorators(ApiTags('Categories'));

// POST /categories
export const ApiCreateCategory = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Создать новую категорию' }),
    ApiBody({ type: CreateCategoryDto, required: true }),
    ApiCreatedResponse({
      description: 'Категория успешно создана',
      type: Category,
    }),
    ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' }),
    ApiForbiddenResponse({ description: 'Роли пользователя не определены' }),
    ApiForbiddenResponse({ description: 'Недостаточно прав' }),
    ApiNotFoundResponse({
      description: 'Родительская категория с указанным ID не найдена',
    }),
    ApiBadRequestResponse({
      description: 'Такая категория уже существует',
    }),
  );

// GET /categories
export const ApiFindCategories = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Получить список категорий с пагинацией и возможностью поиска',
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
      description: 'Количество категорий на странице (по умолчанию: 20)',
      type: 'number',
      example: 20,
    }),
    ApiQuery({
      name: 'includeAll',
      required: false,
      description:
        'Включать все категории (true) или только категории верхнего уровня (по умолчанию: false)',
      type: 'boolean',
      example: false,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Поиск по категориям',
      type: 'string',
      example: 'музыка',
    }),
    ApiOkResponse({
      description: 'Список категорий успешно получен',
      type: [Category],
    }),
  );

// GET /categories/:id
export const ApiFindOneCategory = () =>
  applyDecorators(
    ApiOperation({ summary: 'Получить категорию по ID' }),
    ApiParam({
      name: 'id',
      description: 'ID категории',
      type: 'string',
      example: '48b07f16-fb24-4c82-a943-3c9975513655',
    }),
    ApiOkResponse({
      description: 'Категория найдена',
      type: Category,
    }),
    ApiNotFoundResponse({ description: 'Категория не найдена' }),
  );

// DELETE /categories/:id
export const ApiRemoveCategory = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Удалить категорию' }),
    ApiParam({
      name: 'id',
      description: 'ID категории',
      type: 'string',
      example: '48b07f16-fb24-4c82-a943-3c9975513655',
    }),
    ApiOkResponse({
      description: 'Категория удалена',
    }),
    ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' }),
    ApiForbiddenResponse({ description: 'Роли пользователя не определены' }),
    ApiForbiddenResponse({ description: 'Недостаточно прав' }),
    ApiNotFoundResponse({ description: 'Категория не найдена' }),
    ApiBadRequestResponse({
      description:
        'Нельзя удалить категорию с подкатегориями.' +
        'Сначала удалите или переместите подкатегории.',
    }),
  );

// PATCH /categories/:id
export const ApiUpdateCategory = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Обновить категорию',
    }),
    ApiParam({
      name: 'id',
      description: 'ID категории',
      type: 'string',
      example: '48b07f16-fb24-4c82-a943-3c9975513655',
    }),
    ApiBody({
      type: UpdateCategoryDto,
      required: true,
      description: 'Данные для обновления категории',
    }),
    ApiOkResponse({
      description: 'Категория успешно обновлена',
      type: Category,
    }),
    ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' }),
    ApiForbiddenResponse({ description: 'Роли пользователя не определены' }),
    ApiForbiddenResponse({ description: 'Недостаточно прав' }),
    ApiNotFoundResponse({ description: 'Категория не найдена' }),
    ApiBadRequestResponse({
      description: 'Категория с таким именем уже существует на этом уровне',
    }),
    ApiBadRequestResponse({
      description: 'Категория не может быть родителем самой себя',
    }),
    ApiBadRequestResponse({
      description: 'Нельзя сделать родителем дочернюю категорию',
    }),
    ApiNotFoundResponse({ description: 'Родительская категория не найдена' }),
  );
