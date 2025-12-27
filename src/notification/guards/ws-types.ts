import { User } from '../../users/entities/user.entity';

/**
 * Типы уведомлений
 */
export type NotificationType =
  | 'new_request'
  | 'request_accepted'
  | 'request_rejected';

/**
 * Payload для JWT токена
 */
export interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Расширенный клиент Websocket с данными авторизации
 */
export interface WsClient {
  handshake: {
    query: { token?: string };
  };
  data: {
    user?: User;
  };
  join(room: string): void;
  disconnect(): void;
}

/**
 * Структура уведомления, отправляемого клиенту
 */
export interface NotificationPayload {
  type: NotificationType;
  skillName: string;
  fromUser: string;
  timestamp: Date;
}
