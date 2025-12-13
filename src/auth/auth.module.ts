import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { PassportModule } from '@nestjs/passport'; // npm install --save-dev @types/passport-jwt

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, JwtRefreshStrategy],
})
export class AuthModule {}
