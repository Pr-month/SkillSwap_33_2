import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refreshToken.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RegisterDto } from '../auth/dto/register-user.dto';
import { UserRole } from '../users/enums';
import { LoginDto } from './dto/login.dto';
import { TJwtPayload, Tokens } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.register(registerDto);

    const tokens = await this._generateTokens(user);

    return { ...tokens };
  }

  private async _generateTokens(user: User): Promise<Tokens> {
    const payload: TJwtPayload = {
      sub: user.id,
      email: user.email,
      role: UserRole.USER,
    };

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

    const tokenEntity = this.refreshTokensRepository.create({
      refreshToken,
      user,
    });

    await this.refreshTokensRepository.save(tokenEntity);

    return {
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto): Promise<Tokens> {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new NotFoundException(
        `Пользователь с email ${loginDto.email} не найден`,
      );
    }
    //Добавить проверку пароля
    return this._generateTokens(user);
  }

  async refresh(payload: TJwtPayload): Promise<Tokens> {
    const user = await this.usersService.findUserById(payload.sub);
    return this._generateTokens(user);
  }

  logout(): void {
    return;
  }
}
