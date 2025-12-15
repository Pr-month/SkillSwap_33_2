import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { TAuthResponse } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
