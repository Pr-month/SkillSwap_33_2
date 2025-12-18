import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register-user.dto';
import { Tokens } from '../auth/types';
import { AuthService } from '../auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<Tokens> {
    return await this.authService.register(registerDto);
  }
}
