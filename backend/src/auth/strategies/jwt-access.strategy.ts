import { Injectable } from '@nestjs/common';
import { TJwtPayload } from '../types';
import { PassportStrategy } from '@nestjs/passport'; // npm install --save-dev @types/passport-jwt
import { ExtractJwt, Strategy } from 'passport-jwt'; // npm install passport-jwt
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_CONFIG.accessToken',
        'access_secret',
      ),
    });
  }

  async validate(payload: TJwtPayload) {
    await Promise.resolve();
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
