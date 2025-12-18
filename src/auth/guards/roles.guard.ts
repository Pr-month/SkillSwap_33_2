import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/enums';

// Интерфейс для пользователя (соответствует существующей JWT стратегии)
interface JwtUser {
  userId: string;
  email: string;
  roles: string[];
}

// Интерфейс для Request
interface RequestWithUser {
  user?: JwtUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Используем дженерик для типизации getRequest
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new ForbiddenException('Пользователь не найден');
    }

    const userRoles = request.user.roles;

    if (!Array.isArray(userRoles)) {
      throw new ForbiddenException('Роли пользователя не определены');
    }

    // Фильтруем только строки на случай, если в массиве что-то другое
    const validRoles = userRoles.filter(
      (role: unknown): role is string => typeof role === 'string',
    );

    if (validRoles.length === 0) {
      throw new ForbiddenException('Роли пользователя не определены');
    }

    const hasRequiredRole = requiredRoles.some((requiredRole) =>
      validRoles.includes(requiredRole),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException('Недостаточно прав');
    }

    return true;
  }
}
