import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from 'src/users/entities/refreshToken.entity';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from './guards/roles.guard';
import { MailModule } from '../mail/mail.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken, User]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtRefreshStrategy,
    JwtAccessStrategy,
    JwtService,
    ConfigService,
    RolesGuard,
    MailModule,
  ],
  exports: [RolesGuard],
})
export class AuthModule {}
