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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.register(registerDto);
    const tokens = await this.generateTokens(user);

    return { ...tokens };
  }

  async generateTokens(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    if (!payload.email || !payload.sub || !payload.role) {
      throw new Error(`Отсутсвуют данные payload`);
    }

    const jwtConfig = this.configService.get<JwtConfig>('JWT_CONFIG');

    if (!jwtConfig) {
      throw new Error('Отсутсвует JWT конфигурация');
    }

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: 3600,
      secret: jwtConfig.accessToken,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: 604800,
      secret: jwtConfig.refreshToken,
    });

    await this.createRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async createRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<RefreshToken> {
    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new Error(`Пользователь с ${userId} не найден`);
    }

    const tokenEntity = this.refreshTokensRepository.create({
      refreshToken,
      user,
    });

    return await this.refreshTokensRepository.save(tokenEntity);
    }

  private async _generateTokens(payload: TJwtPayload): Promise<LoginResponse> {
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
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = { id: '1', email: loginDto.email, role: UserRole.USER };

    const payload: TJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this._generateTokens(payload);
  }

  async refresh(payload: TJwtPayload): Promise<LoginResponse> {
    return this._generateTokens(payload);
  }

  logout(): void {
    return;
  }
}
