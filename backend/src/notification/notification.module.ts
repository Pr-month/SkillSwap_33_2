import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { NotificationsGateway } from './notifications.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { wsConfig } from '../config/ws.config';

@Module({
  imports: [ConfigModule.forFeature(wsConfig), AuthModule, UsersModule],
  providers: [NotificationsGateway, WsJwtGuard],
  exports: [NotificationsGateway],
})
export class NotificationModule {}
