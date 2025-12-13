import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport'; // npm install --save-dev @types/passport-jwt
import { ExtractJwt, Strategy } from 'passport-jwt'; // npm install passport-jwt
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  roles?: string[];
}

interface ValidateResult {
  userId: string;
  email: string;
  refreshToken: string | undefined;
  roles: string[];
}

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

  async validate(req: Request, payload: JwtPayload): Promise<ValidateResult> {
    await Promise.resolve();
    const refreshToken = req.headers['authorization']?.split(' ')[1];
    return {
      userId: payload.sub,
      email: payload.email,
      refreshToken,
      roles: payload.roles || [],
    };
  }
}
