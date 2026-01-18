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
import {
  ApiAuthTag,
  ApiGetCsrfToken,
  ApiRegister,
  ApiLogin,
  ApiRefreshToken,
  ApiLogout,
} from '../swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register-user.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Tokens, TAuthResponse } from './types';
import { Request } from 'express';

@ApiAuthTag()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('csrf-token')
  @HttpCode(HttpStatus.OK)
  @ApiGetCsrfToken()
  getCsrfToken(@Req() req: Request) {
    return {
      csrfToken: req.csrfToken(),
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiRegister()
  async register(@Body() registerDto: RegisterDto): Promise<Tokens> {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiLogin()
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(JwtRefreshGuard)
  @ApiRefreshToken()
  refresh(@Req() req: TAuthResponse) {
    const { sub, email, role } = req.user;
    return this.authService.refresh({ sub, email, role });
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtRefreshGuard)
  @ApiLogout()
  logout() {
    this.authService.logout();
    return { message: 'Logged out successfully' };
  }
}
