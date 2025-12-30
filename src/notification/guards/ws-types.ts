import { Socket } from 'socket.io';
import { User } from '../../users/entities/user.entity';

/**
 * Типы уведомлений
 */
export type NotificationType =
  | 'new_request'
  | 'request_accepted'
  | 'request_rejected';

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

/**
 * Расширенный WebSocket-клиент с данными авторизации
 */
export interface WsSocket extends Socket {
  data: {
    user?: User;
  };
}
