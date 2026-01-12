import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginDto } from '../auth/dto/login.dto';
import { RegisterDto } from '../auth/dto/register-user.dto';
import { TokensResponse } from './swagger-types';

export const ApiAuthTag = () => applyDecorators(ApiTags('Auth'));

// GET /auth/csrf-token
export const ApiGetCsrfToken = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Получить CSRF токен',
      description:
        'Получение токена для защиты от межсайтовой подделки запросов. Токен необходимо добавлять в заголовок X-CSRF-Token для всех модифицирующих запросов.',
    }),
    ApiResponse({
      status: 200,
      description: 'CSRF токен успешно получен',
      schema: {
        example: {
          csrfToken: 'csrf-token-value-here',
        },
      },
    }),
  );

// POST /auth/register
export const ApiRegister = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Регистрация нового пользователя',
      description:
        'Создание нового аккаунта пользователя. Возвращает JWT токены.',
    }),
    ApiBody({
      type: RegisterDto,
      required: true,
      description: 'Данные для регистрации пользователя',
    }),
    ApiResponse({
      status: 201,
      description: 'Пользователь успешно зарегистрирован',
      type: TokensResponse,
    }),
    ApiResponse({
      status: 400,
      description: 'Некорректные данные или пользователь уже существует',
    }),
    ApiResponse({
      status: 409,
      description: 'Пользователь с таким email уже существует',
    }),
  );

// POST /auth/login
export const ApiLogin = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Вход в систему',
      description:
        'Аутентификация пользователя по email и паролю. Возвращает JWT токены.',
    }),
    ApiBody({
      type: LoginDto,
      required: true,
      description: 'Учетные данные пользователя',
    }),
    ApiResponse({
      status: 200,
      description: 'Успешная аутентификация',
      type: TokensResponse,
    }),
    ApiResponse({
      status: 400,
      description: 'Некорректные данные',
    }),
    ApiResponse({
      status: 401,
      description: 'Неверный email или пароль',
    }),
  );

// POST /auth/refresh
export const ApiRefreshToken = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Обновление токена доступа',
      description:
        'Обновление access токена с использованием refresh токена. Refresh токен должен быть передан в заголовке Authorization.',
    }),
    ApiResponse({
      status: 200,
      description: 'Токены успешно обновлены',
      type: TokensResponse,
    }),
    ApiResponse({
      status: 401,
      description: 'Невалидный или просроченный refresh токен',
    }),
  );

// POST /auth/logout
export const ApiLogout = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Выход из системы',
      description:
        'Завершение сессии пользователя. Требуется передать refresh токен в заголовке Authorization.',
    }),
    ApiResponse({
      status: 200,
      description: 'Успешный выход из системы',
      schema: {
        example: {
          message: 'Logged out successfully',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Невалидный или просроченный refresh токен',
    }),
  );
