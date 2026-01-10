import {
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { wsConfig } from '../config/ws.config';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { NotificationPayload, WsSocket } from './guards/ws-types';

/**
 * Порт WebSocket-сервера уведомлений.
 * Значение берётся из переменной окружения WS_NOTIFICATIONS_PORT,
 * по умолчанию — 4000.
 */
const WS_PORT = Number(wsConfig().port);

/**
 * WebSocket-шлюз для отправки уведомлений авторизованным пользователям.
 *
 * Подключение: ws://<host>:<port>?token=<JWT>
 * После успешной авторизации клиент автоматически присоединяется
 * к комнате с ID пользователя для получения уведомлений.
 */
@WebSocketGateway(WS_PORT, {
  cors: {
    origin: '*', // Разрешены все origins (для dev; в prod ограничить)
  },
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection {
  /**
   * Экземпляр WebSocket-сервера (socket.io).
   * Используется для отправки сообщений в комнаты.
   */
  @WebSocketServer()
  server: Server;

  constructor(private jwtGuard: WsJwtGuard) {}

  /**
   * Обрабатывает входящее WebSocket-соединение.
   *
   * 1. Извлекает JWT-токен из query-параметра `token`,
   * 2. Проверяет валидность токена и наличие пользователя в БД,
   * 3. При успехе присоединяет клиента к комнате `user.id`,
   * 4. При ошибке — принудительно отключает клиента.
   *
   * @param client Соединение клиента (socket.io)
   */
  async handleConnection(client: Socket) {
    try {
      // Приведение к расширенному типу с данными авторизации
      const wsClient = client as WsSocket;
      await this.jwtGuard.verify(wsClient);

      // Проверка гарантии наличия пользователя после верификации
      if (!wsClient.data.user) {
        client.disconnect(true);
        return;
      }

      // Присоединение к персональной комнате пользователя
      const userId = wsClient.data.user.id;
      await client.join(userId);
    } catch {
      // Любая ошибка авторизации → отключение клиента
      client.disconnect(true);
    }
  }

  /**
   * Отправляет уведомление в комнату указанного пользователя.
   *
   * Используется другими сервисами (например, RequestsService)
   * для оповещения о новых, принятых или отклонённых заявках.
   *
   * @param userId Идентификатор получателя (совпадает с ID комнаты)
   * @param payload Данные уведомления:
   *   - type: 'new_request' | 'request_accepted' | 'request_rejected'
   *   - skillName: название навыка
   *   - fromUser: имя отправителя заявки
   */
  notifyUser(userId: string, payload: NotificationPayload): void {
    this.server.to(userId).emit('notificateNewRequest', payload);
  }
}
