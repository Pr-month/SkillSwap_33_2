import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // npm install passport-jwt

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest<TUser = any>(err: any, user: TUser) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid refresh token');
    }
    return user;
  }
}
