import { ConflictException, Injectable } from '@nestjs/common';
import { RegisterDto } from 'src/auth/dto/register-user.dto';
import { UserRepository } from '../repository/register-user.repository';
import { JwtConfig } from '../config/jwt.config';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const findUser = await this.userRepository.findUserByEmail(
      registerDto.email,
    );
    if (findUser) {
      throw new ConflictException(
        `Пользователь с ${registerDto.email} уже существует!`,
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.userRepository.createUser(
      registerDto,
      hashedPassword,
    );

    const { accessToken, refreshToken } = await this.generateTokens(user);

    return { accessToken, refreshToken };
  }

  private async generateTokens(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.userRole };

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

    await this.userRepository.createRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }
}
