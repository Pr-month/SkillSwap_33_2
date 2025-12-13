import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(err: unknown, user: TUser) {
    if (err || !user) {
      throw (err ||
        new UnauthorizedException('Invalid access token')) as unknown;
    }
    return user;
  }
}
