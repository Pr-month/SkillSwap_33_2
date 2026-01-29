import { Inject, Injectable } from '@nestjs/common';
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
import { MailService } from '../mail/mail.service';
import { JwtConfig, jwtConfig } from '../config/jwt.config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
    private readonly mailService: MailService,
    @Inject(jwtConfig.KEY) private readonly jwtConfig: JwtConfig,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.register(registerDto);

    // Генерируем токен подтверждения (на 1 день)
    const confirmToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        secret: this.jwtConfig.accessToken,
        expiresIn: '1d',
      },
    );

    // Отправляем email асинхронно (не ждём ответа)
    this._sendRegistrationConfirmation(user.email, confirmToken).catch(
      (error) => {
        console.error('Не удалось отправить email подтверждения:', error);
      },
    );

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
    const user = await this.usersService.findUserByEmail(loginDto.email);
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    // Проверка пароля (bcrypt)
    const bcrypt = await import('bcrypt');
    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new Error('Неверный пароль');
    }
    return this._generateTokens(user);
  }

  async refresh(payload: TJwtPayload): Promise<Tokens> {
    const user = await this.usersService.findUserById(payload.sub);
    return this._generateTokens(user);
  }

  logout(): void {
    return;
  }

  private async _sendRegistrationConfirmation(
    email: string,
    token: string,
  ): Promise<void> {
    const clientUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const confirmUrl = `${clientUrl}/confirm-email?token=${token}`;

    await this.mailService.send({
      to: email,
      subject: 'Подтверждение регистрации в SkillSwap',
      text: `Привет!\n\nСпасибо за регистрацию в SkillSwap. Перейдите по ссылке, чтобы подтвердить email:\n\n${confirmUrl}\n\nС уважением, команда SkillSwap.`,
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      // Не раскрываем, что email не существует (защита от перебора)
      return;
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        secret: this.jwtConfig.resetToken,
        expiresIn: '1h',
      },
    );

    await this._sendPasswordReset(email, resetToken).catch((error) => {
      console.error('Не удалось отправить email сброса пароля:', error);
    });
  }

  private async _sendPasswordReset(
    email: string,
    token: string,
  ): Promise<void> {
    const clientUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;

    await this.mailService.send({
      to: email,
      subject: 'Восстановление пароля в SkillSwap',
      text: `Здравствуйте!\n\nВы запросили восстановление пароля. Перейдите по ссылке, чтобы задать новый пароль:\n\n${resetUrl}\n\nЕсли вы не запрашивали это — проигнорируйте письмо.\n\nС уважением, команда SkillSwap.`,
    });
  }
}
