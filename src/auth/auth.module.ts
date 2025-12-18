import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { PassportModule } from '@nestjs/passport'; // npm install --save-dev @types/passport-jwt
import { UsersModule } from '../users/users.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PassportModule, UsersModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, JwtRefreshStrategy, JwtAccessStrategy],
})
export class AuthModule {}
