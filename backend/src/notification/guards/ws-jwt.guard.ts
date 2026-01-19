import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { UsersService } from '../../users/users.service';
import { WsClient } from './ws-types';
import { JwtConfig, jwtConfig } from '../../config/jwt.config';
import { TJwtPayload } from '../../auth/types';

@Injectable()
export class WsJwtGuard {
  constructor(
    private jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfig: JwtConfig,
    private userService: UsersService,
  ) {}

  /**
   * Проверяет JWT-токен из query-параметра WebSocket-соединения
   * и устанавливает пользователя в client.data.user при успехе
   */
  async verify(client: WsClient): Promise<void> {
    const token = client.handshake.query?.token;

    if (!token) {
      throw new WsException('Token is missing');
    }

    try {
      const payload = this.jwtService.verify<TJwtPayload>(token, {
        secret: this.jwtConfig.accessToken,
      });

      const user = await this.userService.findUserById(payload.sub);

      // Если findUserById не бросит ошибку — user точно существует
      client.data = { user };
    } catch (error: unknown) {
      // Безопасная проверка типа ошибки
      if (error instanceof Error && error.name === 'EntityNotFoundError') {
        throw new WsException('User not found');
      }
      // Любая другая ошибка (невалидный токен, просрочен и т.д.)
      throw new WsException('Invalid token');
    }
  }
}
