import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { WsJwtGuard } from './ws-jwt.guard';
import { WsClient } from './ws-types';
import { jwtConfig } from '../../config/jwt.config';
import { TJwtPayload } from '../../auth/types';
import { UsersService } from '../../users/users.service';
import { UserRole, GenderOption } from '../../users/enums';

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;
  let mockVerify: jest.Mock;
  let mockFindUserById: jest.Mock;

  const createClient = (token?: string): WsClient => ({
    handshake: { query: token ? { token } : {} },
    data: {},
    join: jest.fn(),
    disconnect: jest.fn(),
  });

  beforeEach(async () => {
    mockVerify = jest.fn();
    mockFindUserById = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsJwtGuard,
        {
          provide: JwtService,
          useValue: {
            verify: mockVerify,
          },
        },
        {
          provide: UsersService,
          useValue: {
            findUserById: mockFindUserById,
          },
        },
        {
          provide: jwtConfig.KEY,
          useValue: { accessToken: 'test-secret' },
        },
      ],
    }).compile();

    guard = module.get(WsJwtGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set user in client.data when token is valid', async () => {
    const client = createClient('valid.jwt.token');

    const payload: TJwtPayload = {
      sub: 'user123',
      email: 'test@example.com',
      role: UserRole.USER,
    };

    const mockUser = {
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'securePassword123',
      about: 'About me',
      birthdate: new Date('1990-01-01'),
      city: 'Moscow',
      gender: GenderOption.MALE,
      role: UserRole.USER,
    };

    mockVerify.mockReturnValue(payload);
    mockFindUserById.mockResolvedValue(mockUser);

    await guard.verify(client);

    expect(mockVerify).toHaveBeenCalledWith('valid.jwt.token', {
      secret: 'test-secret',
    });
    expect(mockFindUserById).toHaveBeenCalledWith('user123');
    expect(client.data).toEqual({ user: mockUser });
  });

  it('should throw WsException if token is missing', async () => {
    const client = createClient();
    await expect(guard.verify(client)).rejects.toThrow(
      new WsException('Token is missing'),
    );
  });

  it('should throw WsException if token is invalid', async () => {
    const client = createClient('invalid.token');
    mockVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await expect(guard.verify(client)).rejects.toThrow(
      new WsException('Invalid token'),
    );
  });

  it('should throw WsException if user is not found', async () => {
    const client = createClient('valid.jwt.token');

    const payload: TJwtPayload = {
      sub: 'nonexistent',
      email: 'test@example.com',
      role: UserRole.USER,
    };

    const error = new Error('User not found');
    error.name = 'EntityNotFoundError';

    mockVerify.mockReturnValue(payload);
    mockFindUserById.mockRejectedValue(error);

    await expect(guard.verify(client)).rejects.toThrow(
      new WsException('User not found'),
    );
  });
});
