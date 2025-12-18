import { Injectable } from '@nestjs/common';
import { JwtConfig } from '../config/jwt.config';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refreshToken.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RegisterDto } from '../auth/dto/register-user.dto';
import { UserRole } from 'src/users/enums';
import { LoginDto } from './dto/login.dto';
import { TJwtPayload, Tokens } from './types';

interface LoginResponse {
  access_token: string,
  refresh_token: string,
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
  ) { }

  async register(registerDto: RegisterDto) {
    const { email, id: sub } = await this.usersService.register(registerDto);
    const payload: TJwtPayload = {
      sub,
      email,
      role: UserRole.USER
    };

    const tokens = await this._generateTokens(payload);

    return { ...tokens };
  }

  private async _generateTokens(payload: TJwtPayload): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_TOKEN || 'access_secret',
        expiresIn: '1h' as const,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_TOKEN || 'refresh_secret',
        expiresIn: '7d' as const,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto): Promise<Tokens> {
    const user = { id: '1', email: loginDto.email, role: UserRole.USER };

    const payload: TJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this._generateTokens(payload);
  }

  async refresh(payload: TJwtPayload): Promise<Tokens> {
    return this._generateTokens(payload);
  }

  logout(): void {
    return;
  }
}
