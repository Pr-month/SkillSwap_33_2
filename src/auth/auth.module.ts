import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { PassportModule } from '@nestjs/passport'; // npm install --save-dev @types/passport-jwt
import { ConfigModule } from '@nestjs/config';
import { jwtConfig } from '../config/jwt.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refreshToken.entity';
import { UserRepository } from '../repository/register-user.repository';

@Module({
  imports: [
    PassportModule,
    ConfigModule.forFeature(jwtConfig),
    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtRefreshStrategy,
    JwtAccessStrategy,
    UserRepository,
  ],
})
export class AuthModule {}
