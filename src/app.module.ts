import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { jwtConfig } from './config/jwt.config';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig],
    }),
    // Убрал JwtModule - используем локальный в AuthModule
    // 1. Нет дублирования — JwtModule только в AuthModule где нужен,
    // 2. ConfigModule глобальный — все модули видят JWT_CONFIG,
    // 3. Чистая архитектура — каждый модуль отвечает за свои зависимости.
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
