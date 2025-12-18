import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { PassportModule } from '@nestjs/passport'; // npm install --save-dev @types/passport-jwt
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '../users/entities/refreshToken.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtRefreshStrategy,
    JwtAccessStrategy,
    JwtService,
    ConfigService,
  ],
})
export class AuthModule {}
