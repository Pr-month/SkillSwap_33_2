import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from '../users/entities/refreshToken.entity';
import { User } from '../users/entities/user.entity';

enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

enum GenderOption {
  MALE = 'male',
  FEMALE = 'female',
}

interface RegisterDto {
  email: string;
  password: string;
  name: string;
  birthdate: string;
  gender: GenderOption;
  city: string;
  about: string;
}

interface LoginDto {
  email: string;
  password: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

type UsersServiceMock = {
  register: jest.Mock<Promise<User>, [RegisterDto]>;
  findUserById: jest.Mock<Promise<User | null>, [string]>;
  findUserByEmail: jest.Mock<Promise<User | null>, [string]>;
};

type JwtServiceMock = {
  signAsync: jest.Mock<
    Promise<string>,
    [JwtPayload, { secret: string; expiresIn: string }]
  >;
};

type RefreshTokenRepositoryMock = {
  create: jest.Mock<any, [any]>;
  save: jest.Mock<Promise<any>, [any]>;
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersServiceMock: UsersServiceMock;
  let jwtServiceMock: JwtServiceMock;
  let refreshTokenRepositoryMock: RefreshTokenRepositoryMock;

  beforeEach(async () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      role: UserRole.USER,
    } as User;

    usersServiceMock = {
      register: jest.fn<Promise<User>, [RegisterDto]>(),
      findUserById: jest.fn<Promise<User | null>, [string]>(),
      findUserByEmail: jest.fn<Promise<User | null>, [string]>(),
    };

    usersServiceMock.register.mockResolvedValue(mockUser);
    usersServiceMock.findUserById.mockResolvedValue(mockUser);
    usersServiceMock.findUserByEmail.mockResolvedValue(mockUser);

    jwtServiceMock = {
      signAsync: jest.fn<
        Promise<string>,
        [JwtPayload, { secret: string; expiresIn: string }]
      >(),
    };

    jwtServiceMock.signAsync
      .mockResolvedValueOnce('mock-access-token')
      .mockResolvedValueOnce('mock-refresh-token');

    const configServiceMock = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key.includes('access')) return 'access_secret';
        if (key.includes('refresh')) return 'refresh_secret';
        return null;
      }),
    };

    refreshTokenRepositoryMock = {
      create: jest.fn<any, [any]>(),
      save: jest.fn<Promise<any>, [any]>(),
    };

    refreshTokenRepositoryMock.create.mockReturnValue({
      id: 'token-123',
      refreshToken: 'mock-refresh-token',
      user: mockUser,
    });

    refreshTokenRepositoryMock.save.mockResolvedValue({ id: 'token-123' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepositoryMock,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('basic functionality', () => {
    it('should register user and return tokens', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        birthdate: '1990-01-01',
        gender: GenderOption.MALE,
        city: 'Test City',
        about: 'Test about',
      };

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('should login user and return tokens', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('should refresh tokens', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER,
      };

      const result = await authService.refresh(payload);

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('should logout successfully', () => {
      const result = authService.logout();
      expect(result).toBeUndefined();
    });
  });

  describe('extended tests', () => {
    describe('token generation', () => {
      it('should generate both access and refresh tokens', async () => {
        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'Password123',
        };

        await authService.login(loginDto);

        const signAsyncCallCount = jwtServiceMock.signAsync.mock.calls.length;
        expect(signAsyncCallCount).toBe(2);
      });

      it('should save refresh token to repository', async () => {
        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'Password123',
        };

        await authService.login(loginDto);

        const createCallCount =
          refreshTokenRepositoryMock.create.mock.calls.length;
        const saveCallCount = refreshTokenRepositoryMock.save.mock.calls.length;

        expect(createCallCount).toBe(1);
        expect(saveCallCount).toBe(1);
      });

      it('should use correct JWT payload structure', async () => {
        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'Password123',
        };

        await authService.login(loginDto);

        const signAsyncCalls = jwtServiceMock.signAsync.mock.calls;
        expect(signAsyncCalls).toHaveLength(2);

        const firstCall = signAsyncCalls[0];
        expect(firstCall[0]).toEqual({
          sub: '1',
          email: 'test@example.com',
          role: UserRole.USER,
        });

        const secondCall = signAsyncCalls[1];
        expect(secondCall[0]).toEqual({
          sub: '1',
          email: 'test@example.com',
          role: UserRole.USER,
        });
      });
    });

    describe('error handling', () => {
      it('should handle registration errors from UsersService', async () => {
        const registerDto: RegisterDto = {
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
          birthdate: '1990-01-01',
          gender: GenderOption.MALE,
          city: 'Test City',
          about: 'Test about',
        };

        const error = new Error('User already exists');
        usersServiceMock.register.mockRejectedValueOnce(error);

        await expect(authService.register(registerDto)).rejects.toThrow(
          'User already exists',
        );
      });

      it('should handle refresh token repository errors', async () => {
        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'Password123',
        };

        const saveError = new Error('Database connection failed');
        refreshTokenRepositoryMock.save.mockRejectedValueOnce(saveError);

        await expect(authService.login(loginDto)).rejects.toThrow(
          'Database connection failed',
        );
      });

      it('should throw error when user not found during refresh', async () => {
        const payload = {
          sub: 'non-existent-id',
          email: 'notfound@example.com',
          role: UserRole.USER,
        };

        usersServiceMock.findUserById.mockResolvedValueOnce(null);

        await expect(authService.refresh(payload)).rejects.toThrow();
      });

      it('should propagate errors from findUserById', async () => {
        const payload = {
          sub: 'user-123',
          email: 'test@example.com',
          role: UserRole.USER,
        };

        const dbError = new Error('Database error');
        usersServiceMock.findUserById.mockRejectedValueOnce(dbError);

        await expect(authService.refresh(payload)).rejects.toThrow(
          'Database error',
        );
      });
    });

    describe('method interactions', () => {
      it('should call UsersService.register with correct data', async () => {
        const registerDto: RegisterDto = {
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
          birthdate: '1990-01-01',
          gender: GenderOption.MALE,
          city: 'Test City',
          about: 'Test about',
        };

        await authService.register(registerDto);

        const registerCalls = usersServiceMock.register.mock.calls;
        expect(registerCalls).toHaveLength(1);
        expect(registerCalls[0][0]).toEqual(registerDto);
      });

      it('should call UsersService.findUserById during refresh', async () => {
        const payload = {
          sub: 'user-123',
          email: 'test@example.com',
          role: UserRole.USER,
        };

        await authService.refresh(payload);

        const findUserCalls = usersServiceMock.findUserById.mock.calls;
        expect(findUserCalls).toHaveLength(1);
        expect(findUserCalls[0][0]).toBe('user-123');
      });

      it('should create and save refresh token entity', async () => {
        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'Password123',
        };

        await authService.login(loginDto);

        const createCalls = refreshTokenRepositoryMock.create.mock.calls;
        const saveCalls = refreshTokenRepositoryMock.save.mock.calls;

        expect(createCalls).toHaveLength(1);
        expect(saveCalls).toHaveLength(1);
        expect(createCalls[0][0]).toHaveProperty(
          'refreshToken',
          'mock-refresh-token',
        );
      });
    });

    describe('environment configuration', () => {
      it('should use environment variables or default values for JWT secrets', async () => {
        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'Password123',
        };

        await authService.login(loginDto);

        const signAsyncCalls = jwtServiceMock.signAsync.mock.calls;
        expect(signAsyncCalls).toHaveLength(2);

        expect(signAsyncCalls[0][1]).toHaveProperty('expiresIn', '1h');
        expect(signAsyncCalls[1][1]).toHaveProperty('expiresIn', '7d');
      });

      it('should fallback to default secrets when env vars not set', async () => {
        const configServiceMock = {
          get: jest.fn().mockReturnValue(null),
        };

        const module: TestingModule = await Test.createTestingModule({
          providers: [
            AuthService,
            { provide: UsersService, useValue: usersServiceMock },
            { provide: JwtService, useValue: jwtServiceMock },
            { provide: ConfigService, useValue: configServiceMock },
            {
              provide: getRepositoryToken(RefreshToken),
              useValue: refreshTokenRepositoryMock,
            },
          ],
        }).compile();

        const authServiceWithDefaultConfig =
          module.get<AuthService>(AuthService);

        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'Password123',
        };

        await authServiceWithDefaultConfig.login(loginDto);

        const signAsyncCallCount = jwtServiceMock.signAsync.mock.calls.length;
        expect(signAsyncCallCount).toBeGreaterThan(0);
      });
    });

    describe('logout method', () => {
      it('should be a void function', () => {
        const result = authService.logout();
        expect(result).toBeUndefined();
      });

      it('should not throw any errors', () => {
        expect(() => authService.logout()).not.toThrow();
      });
    });
  });
});
