import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';
import { NotificationsGateway } from './notifications.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { NotificationPayload, WsSocket } from './guards/ws-types';
import { User } from '../users/entities/user.entity';
import { GenderOption, UserRole } from '../users/enums';

const createMockUser = (id: string): User => {
  return {
    id,
    name: 'Test User',
    email: 'test@example.com',
    password: 'securePassword123',
    about: 'About me',
    birthdate: new Date('1990-01-01'),
    city: 'Moscow',
    gender: GenderOption.MALE,
    role: UserRole.USER,
    avatar: null as unknown as string,
    refreshTokens: [],
    skills: [],
    wantToLearn: [],
    favoriteSkills: [],
    emailToLowerCase: jest.fn(),
  } as User;
};

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let mockVerify: jest.Mock;

  let mockServer: {
    to: jest.Mock;
    emit: jest.Mock;
  };

  beforeEach(async () => {
    mockVerify = jest.fn();

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: WsJwtGuard,
          useValue: {
            verify: mockVerify,
          },
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);

    gateway.server = mockServer as unknown as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    const createMockClient = (user?: User) => {
      return {
        handshake: {
          query: { token: user ? 'valid.token' : 'invalid.token' },
        },
        data: { user },
        join: jest.fn(),
        disconnect: jest.fn(),
      };
    };

    it('should join user room on successful verification', async () => {
      const user = createMockUser('user123');
      const client = createMockClient(user);

      mockVerify.mockResolvedValue(undefined);

      await gateway.handleConnection(client as unknown as WsSocket);

      expect(mockVerify).toHaveBeenCalledWith(client);
      expect(client.join).toHaveBeenCalledWith(user.id);
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect client if jwtGuard.verify throws', async () => {
      const client = createMockClient(undefined);

      mockVerify.mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(client as unknown as WsSocket);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should disconnect client if user is not set after verification', async () => {
      const client = createMockClient(undefined);

      mockVerify.mockResolvedValue(undefined);

      await gateway.handleConnection(client as unknown as WsSocket);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.join).not.toHaveBeenCalled();
    });
  });

  describe('notifyUser', () => {
    it('should emit notification to user room', () => {
      const userId = 'user123';
      const payload: NotificationPayload = {
        type: 'new_request',
        skillName: 'TypeScript',
        fromUser: 'John Doe',
        timestamp: new Date(),
      };

      gateway.notifyUser(userId, payload);

      expect(mockServer.to).toHaveBeenCalledWith(userId);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'notificateNewRequest',
        payload,
      );
    });
  });
});
