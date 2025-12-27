import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { JwtPayload, WsClient } from './ws-types';

@Injectable()
export class WsJwtGuard {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UsersService,
  ) {}

  /**
   * Проверяет JWT-токен из query-параметра WebSocket-соединения
   * и устанавливает пользователя в client.data.user при успехе
   */
  async verify(client: WsClient): Promise<void> {
    const token = client.handshake.query?.token;

    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.userService.findUserById(payload.sub);

      // Если findUserById не бросит ошибку — user точно существует
      client.data = { user };
    } catch (error: unknown) {
      // Безопасная проверка типа ошибки
      if (error instanceof Error && error.name === 'EntityNotFoundError') {
        throw new UnauthorizedException('User not found');
      }
      // Любая другая ошибка (невалидный токен, просрочен и т.д.)
      throw new UnauthorizedException('Invalid token');
    }
  }
}
