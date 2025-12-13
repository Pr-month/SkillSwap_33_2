import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: TUser) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid access token');
    }
    return user;
  }
}
