import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // npm install passport-jwt

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest<TUser = unknown>(err: unknown, user: TUser) {
    if (err || !user) {
      throw (err ||
        new UnauthorizedException('Invalid refresh token')) as unknown;
    }
    return user;
  }
}
