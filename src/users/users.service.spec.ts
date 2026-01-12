import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { appConfig } from '../config/app.config';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GenderOption, UserRole } from './enums';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<Repository<User>>;
  let skillsRepository: jest.Mocked<Repository<Skill>>;

  const appConfigMock = { hashSalt: 10 };

  const createUserMock = (overrides: Partial<User> = {}): User => ({
    id: '1',
    name: 'Test User',
    email: 'user@example.com',
    password: 'oldPassword',
    about: '',
    birthdate: new Date(),
    city: 'Moscow',
    gender: GenderOption.MALE,
    role: UserRole.USER,
    avatar: '',
    favoriteSkills: [],
    skills: [],
    refreshTokens: [],
    wantToLearn: [],
    emailToLowerCase: () => {},
    ...overrides,
  });

  const createUpdatePasswordDto = (): UpdatePasswordDto => ({
    password: 'oldPassword',
    newPassword: 'newPassword',
  });

  const createQueryBuilderMock = () => {
    const qb: Partial<SelectQueryBuilder<User>> = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
    };
    return qb as SelectQueryBuilder<User>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: appConfig.KEY, useValue: appConfigMock },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneOrFail: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    skillsRepository = module.get(getRepositoryToken(Skill));
  });

  afterEach(() => jest.clearAllMocks());

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  // findAll

  describe('findAll', () => {
    it('должен вернуть список всех пользователей', async () => {
      const users = [createUserMock()];
      usersRepository.find.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toEqual(users);
    });
  });

  // register

  describe('register', () => {
    it('должен успешно зарегистрировать нового пользователя', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      usersRepository.save.mockResolvedValue(createUserMock());

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPass' as never);

      const dto = { email: 'user@example.com', password: '12345678' } as any;

      const result = await service.register(dto);
      expect(usersRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('1');
    });

    it('должен выбросить ConflictException, если пользователь уже существует', async () => {
      usersRepository.findOne.mockResolvedValue(createUserMock());
      const dto = { email: 'user@example.com', password: '123456' } as any;

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  // findUserByEmail

  describe('findUserByEmail', () => {
    it('должен найти пользователя по email независимо от регистра', async () => {
      const user = createUserMock();
      usersRepository.findOne.mockResolvedValue(user);

      const result = await service.findUserByEmail('USER@example.com');
      expect(result).toEqual(user);
    });
  });

  // findUserById

  describe('findUserById', () => {
    it('должен вернуть пользователя по id', async () => {
      const user = createUserMock();
      usersRepository.findOneOrFail.mockResolvedValue(user);

      const result = await service.findUserById('1');
      expect(result).toEqual(user);
    });

    it('должен выбросить ошибку, если пользователь не найден', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error('Not found'));
      await expect(service.findUserById('1')).rejects.toThrow();
    });
  });

  // getCurrentUser

  describe('getCurrentUser', () => {
    it('должен вернуть текущего пользователя', async () => {
      const user = createUserMock();
      usersRepository.findOne.mockResolvedValue(user);

      const result = await service.getCurrentUser('1');
      expect(result).toEqual(user);
    });

    it('должен выбросить NotFoundException, если пользователь не найден', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      await expect(service.getCurrentUser('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // updateCurrentUser

  describe('updateCurrentUser', () => {
    it('должен обновить данные текущего пользователя', async () => {
      const existingUser = createUserMock({ password: 'oldPassword' });
      usersRepository.findOne.mockResolvedValue(existingUser);
      usersRepository.save.mockImplementation(async (u) => u as User);

      const updateData: UpdateUserDto = { password: 'newPassword' };
      const result = await service.updateCurrentUser('1', updateData);

      expect(result.password).toBe('newPassword');
      expect(usersRepository.save).toHaveBeenCalled();
    });

    it('должен выбросить NotFoundException, если пользователь не найден', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const updateData: UpdateUserDto = { password: 'newPassword' };

      await expect(service.updateCurrentUser('1', updateData)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // updatePassword

  describe('updatePassword', () => {
    it('должен успешно обновить пароль', async () => {
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(async (value: string) =>
          value === 'oldPassword'
            ? ('hashedOld' as never)
            : ('hashedNew' as never),
        );

      const user = createUserMock({ password: 'hashedOld' });
      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.save.mockImplementation(async (u) => u as User);

      const dto = createUpdatePasswordDto();
      const result = await service.updatePassword('1', dto);

      expect(result.password).toBe('hashedNew');
    });

    it('должен выбросить BadRequestException при неверном старом пароле', async () => {
      usersRepository.findOne.mockResolvedValue(
        createUserMock({ password: 'wrongHash' }),
      );
      const dto = createUpdatePasswordDto();

      await expect(service.updatePassword('1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // findUsersBySimilarSkill

  describe('findUsersBySimilarSkill', () => {
    it('должен вернуть пользователей с похожей категорией навыков', async () => {
      skillsRepository.findOne.mockResolvedValue({
        id: 'skill-1',
        category: { id: 'cat-1' },
      } as Skill);

      const qb = createQueryBuilderMock();
      (qb.getMany as jest.Mock).mockResolvedValue([createUserMock()]);
      usersRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findUsersBySimilarSkill('skill-1');
      expect(result).toHaveLength(1);
      expect(qb.take).toHaveBeenCalledWith(10);
    });
  });

  // findAllFiltered

  describe('findAllFiltered', () => {
    it('должен применить все фильтры и вернуть пользователей', async () => {
      const qb = createQueryBuilderMock();
      (qb.getManyAndCount as jest.Mock).mockResolvedValue([
        [createUserMock()],
        1,
      ]);
      usersRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllFiltered({
        name: 'User',
        email: 'test@mail.com',
        city: 'Moscow',
        role: 'USER',
        gender: 'MALE',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
    });

    it('должен выбросить ForbiddenException, если номер страницы превышает последнюю', async () => {
      const qb = createQueryBuilderMock();
      (qb.getManyAndCount as jest.Mock).mockResolvedValue([[], 1]);
      usersRepository.createQueryBuilder.mockReturnValue(qb);

      await expect(
        service.findAllFiltered({ page: 2, limit: 10 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
