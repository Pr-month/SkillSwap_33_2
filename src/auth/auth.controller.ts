import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Body,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register-user.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Tokens, TAuthResponse } from './types';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Получение CSRF токена для защиты от межсайтовой подделки запросов
   * Клиент должен вызывать этот endpoint при инициализации приложения
   * и добавлять полученный токен в заголовок X-CSRF-Token для всех
   * модифицирующих запросов (POST, PUT, PATCH, DELETE)
   */
  @Get('csrf-token')
  @HttpCode(HttpStatus.OK)
  getCsrfToken(@Req() req: Request) {
    return {
      csrfToken: req.csrfToken(),
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<Tokens> {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(JwtRefreshGuard)
  refresh(@Req() req: TAuthResponse) {
    const { sub, email, role } = req.user;
    return this.authService.refresh({ sub, email, role });
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtRefreshGuard)
  logout() {
    this.authService.logout();
    return { message: 'Logged out successfully' };
  }
}
