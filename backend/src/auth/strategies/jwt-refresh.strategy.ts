import { Injectable } from '@nestjs/common';
import { TJwtPayload } from '../types';
import { PassportStrategy } from '@nestjs/passport'; // npm install --save-dev @types/passport-jwt
import { ExtractJwt, Strategy } from 'passport-jwt'; // npm install passport-jwt
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_CONFIG.refreshToken',
        'refresh_secret',
      ),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: TJwtPayload) {
    await Promise.resolve();
    const refreshToken = req.headers['authorization']?.split(' ')[1];
    return {
      sub: payload.sub,
      email: payload.email,
      refreshToken,
      role: payload.role,
    };
  }
}
