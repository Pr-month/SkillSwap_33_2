import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/enums';
import { AuthenticatedRequest } from '../types'; // ИСПОЛЬЗУЕМ ТИП ИЗ auth/types.ts

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

    // Используем AuthenticatedRequest из auth/types.ts
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

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
