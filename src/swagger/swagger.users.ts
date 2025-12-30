import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResGetUsersDto } from 'src/users/dto/res-get-users.dto';
import { User } from 'src/users/entities/user.entity';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { UpdatePasswordDto } from 'src/users/dto/update-password.dto';

export const ApiUsersTag = () => applyDecorators(ApiTags('Users'));

// GET /users
export const ApiFindUsers = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Получить список пользователей с фильтрацией и пагинацией',
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
      description: 'Количество записей на странице (по умолчанию: 10)',
      type: 'number',
      example: 10,
    }),
    ApiQuery({
      name: 'name',
      required: false,
      description: 'Фильтр по имени пользователя',
      type: 'string',
    }),
    ApiQuery({
      name: 'email',
      required: false,
      description: 'Фильтр по email',
      type: 'string',
    }),
    ApiQuery({
      name: 'city',
      required: false,
      description: 'Фильтр по городу',
      type: 'string',
    }),
    ApiQuery({
      name: 'role',
      required: false,
      description: 'Фильтр по роли',
      type: 'string',
    }),
    ApiQuery({
      name: 'gender',
      required: false,
      description: 'Фильтр по гендеру',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Список пользователей успешно получен',
      type: ResGetUsersDto,
    }),
  );

// GET /me
export const ApiGetMe = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Получить текущего пользователя' }),
    ApiResponse({
      status: 200,
      description: 'Данные текущего пользователя',
      type: User,
    }),
    ApiResponse({
      status: 401,
      description: 'Пользователь не авторизован',
    }),
  );

// PATCH /me
export const ApiUpdateMe = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Обновить данные текущего пользователя' }),
    ApiBody({
      description: 'Данные для обновления профиля',
      type: UpdateUserDto,
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Пользователь успешно обновлен',
      type: User,
    }),
    ApiResponse({
      status: 400,
      description: 'Некорректные данные для обновления',
    }),
    ApiResponse({
      status: 401,
      description: 'Пользователь не авторизован',
    }),
  );

// PATCH /me/password
export const ApiUpdatePassword = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Изменить пароль текущего пользователя' }),
    ApiBody({
      description: 'Данные для смены пароля',
      type: UpdatePasswordDto,
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Пароль успешно изменен',
      type: User,
    }),
    ApiResponse({
      status: 400,
      description: 'Некорректный текущий пароль или новый пароль',
    }),
    ApiResponse({
      status: 404,
      description: 'Пользователь не найден',
    }),
  );

// GET /by-skill/:id — пользователи по навыку
export const ApiFindUsersBySkill = () =>
  applyDecorators(
    ApiOperation({ summary: 'Найти пользователей с указанным навыком' }),
    ApiParam({
      name: 'id',
      description: 'ID навыка',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Список пользователей с указанным навыком',
      type: [User],
    }),
    ApiResponse({
      status: 404,
      description: 'Навык не найден',
    }),
  );

// GET /:id
export const ApiFindUserById = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Получить пользователя по ID' }),
    ApiParam({
      name: 'id',
      description: 'ID пользователя',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Пользователь найден',
      type: User,
    }),
    ApiResponse({
      status: 404,
      description: 'Пользователь не найден',
    }),
  );
