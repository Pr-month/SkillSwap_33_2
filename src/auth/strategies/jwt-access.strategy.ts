import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport'; // npm install --save-dev @types/passport-jwt
import { ExtractJwt, Strategy } from 'passport-jwt'; // npm install passport-jwt
import { ConfigService } from '@nestjs/config';

// Временный интерфейс
interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

// Временный интерфейс
interface ValidateResult {
  userId: string;
  email: string;
  roles: string[];
}

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

  async validate(payload: JwtPayload): Promise<ValidateResult> {
    await Promise.resolve();
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
    };
  }
}
