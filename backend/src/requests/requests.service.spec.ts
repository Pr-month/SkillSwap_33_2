import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestsService } from './requests.service';
import { Request } from './entities/request.entity';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestStatus } from './request-status.enum';
import { GenderOption, UserRole } from '../users/enums';
import { Category } from '../categories/entities/category.entity';
import { NotificationsGateway } from '../notification/notifications.gateway';
import { MailService } from '../mail/mail.service';

// Фабрики для создания мок-данных
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Иван Иванов',
  email: 'ivan@example.com',
  password: 'hashed-password',
  about: 'Обо мне',
  birthdate: new Date('1990-01-01'),
  city: 'Москва',
  gender: GenderOption.MALE,
  avatar: 'avatar-url',
  role: UserRole.USER,
  refreshTokens: [],
  skills: [],
  wantToLearn: [],
  favoriteSkills: [],
  emailToLowerCase: function (this: User) {
    this.email = this.email.toLowerCase();
  },
  isEmailConfirmed: true,
  ...overrides,
});

// Mock entities согласно структуре Entity
const mockUser = createMockUser();

const mockUser2 = createMockUser({
  id: '550e8400-e29b-41d4-a716-446655440002',
  name: 'Мария Петрова',
  email: 'maria@example.com',
});

const mockSkillOffered: Skill = {
  id: '550e8400-e29b-41d4-a716-446655440011',
  title: 'Разработка на React',
  description: 'Фронтенд разработка на React',
  category: null as unknown as Category,
  images: [],
  owner: mockUser,
  interestedUsers: [],
  createdAt: new Date(),
  updatedAt: new Date(),
} as Skill;

const mockSkillRequested: Skill = {
  id: '550e8400-e29b-41d4-a716-446655440012',
  title: 'Разработка на Node.js',
  description: 'Бэкенд разработка на Node.js',
  category: null as unknown as Category,
  images: [],
  owner: mockUser2,
  interestedUsers: [],
  createdAt: new Date(),
  updatedAt: new Date(),
} as Skill;

const mockRequest: Request = {
  id: '550e8400-e29b-41d4-a716-446655440101',
  createdAt: new Date(),
  sender: mockUser,
  receiver: mockUser2,
  status: RequestStatus.PENDING,
  offeredSkill: mockSkillOffered,
  requestedSkill: mockSkillRequested,
  isRead: false,

  // Transformed properties
  senderId: mockUser.id,
  receiverId: mockUser2.id,
  offeredSkillId: mockSkillOffered.id,
  requestedSkillId: mockSkillRequested.id,
} as Request;

const createRequestDto: CreateRequestDto = {
  offeredSkill: { id: mockSkillOffered.id },
  requestedSkill: { id: mockSkillRequested.id },
};

const updateRequestDto: UpdateRequestDto = {
  status: RequestStatus.ACCEPTED,
  isRead: true,
};

import { ObjectLiteral } from 'typeorm';
type MockRepository<T extends ObjectLiteral = any> = {
  [P in keyof Repository<T>]?: jest.Mock;
};

// Хелпер для сброса и установки моков Request
function setupRequestMocks(
  requestRepository: MockRepository<Request>,
  overrides: Partial<Request> = {},
) {
  const request = { ...mockRequest, ...overrides };
  (requestRepository.findOne as jest.Mock).mockResolvedValue(request);
  (requestRepository.save as jest.Mock).mockResolvedValue(request);
  return request;
}

describe('RequestsService', () => {
  // Мок для MailService
  const mockMailService = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  let service: RequestsService;
  let requestRepository: MockRepository<Request>;
  let userRepository: MockRepository<User>;
  let skillRepository: MockRepository<Skill>;
  let notificationsGateway: { notifyUser: jest.Mock };

  beforeEach(async () => {
    requestRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
    };

    skillRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
    };

    // Default behaviour for ownership checks: return matching skill with owner id
    (skillRepository.findOneBy as jest.Mock).mockImplementation(
      (args: unknown) => {
        type WhereShape = { id?: string; owner?: { id?: string } };
        let cond: unknown;
        if (
          args &&
          typeof args === 'object' &&
          Object.prototype.hasOwnProperty.call(args, 'where')
        ) {
          cond = (args as { where: unknown }).where;
        } else {
          cond = args;
        }

        if (!cond || typeof cond !== 'object') return Promise.resolve(null);

        const id = (cond as WhereShape).id;

        if (id === mockSkillRequested.id) {
          return Promise.resolve({
            ...mockSkillRequested,
            owner: { id: mockUser2.id },
          });
        }

        if (id === mockSkillOffered.id) {
          return Promise.resolve({
            ...mockSkillOffered,
            owner: { id: mockUser.id },
          });
        }

        return Promise.resolve(null);
      },
    );

    const mockNotificationsGateway = {
      notifyUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(Request),
          useValue: requestRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: skillRepository,
        },
        {
          provide: NotificationsGateway,
          useValue: mockNotificationsGateway,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);

    notificationsGateway = mockNotificationsGateway;

    jest.clearAllMocks();
    mockMailService.send.mockClear();
  });

  describe('checkUserAccess - проверка доступа к заявке', () => {
    it('должен вернуть заявку если пользователь является участником', async () => {
      setupRequestMocks(requestRepository);
      const result = await service.checkUserAccess(mockRequest.id, mockUser.id);
      expect(result).toEqual(mockRequest);
      expect(requestRepository.findOne as jest.Mock).toHaveBeenCalledWith({
        where: { id: mockRequest.id },
        relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
      });
    });

    it.each([
      [
        'ForbiddenException если пользователь не участник',
        '550e8400-e29b-41d4-a716-446655440999',
        ForbiddenException,
      ],
      [
        'NotFoundException если заявка не найдена',
        mockUser.id,
        NotFoundException,
      ],
    ])('должен выбросить %s', async (_, userId, expectedError) => {
      if (expectedError === ForbiddenException) {
        setupRequestMocks(requestRepository);
        await expect(
          service.checkUserAccess(mockRequest.id, userId),
        ).rejects.toThrow(expectedError);
      } else {
        (requestRepository.findOne as jest.Mock).mockRejectedValue(
          new NotFoundException('Заявка не найдена'),
        );
        await expect(
          service.checkUserAccess('invalid-id', userId),
        ).rejects.toThrow(expectedError);
      }
    });
  });

  describe('create - создание заявки', () => {
    beforeEach(() => {
      // Моки для успешного создания заявки
      (skillRepository.findOne as jest.Mock).mockReset();
      (skillRepository.findOneBy as jest.Mock).mockReset();
      (userRepository.findOne as jest.Mock).mockReset();
      (userRepository.findOneBy as jest.Mock).mockReset();
      (requestRepository.findOne as jest.Mock).mockReset();
      (requestRepository.create as jest.Mock).mockReset();
      (requestRepository.save as jest.Mock).mockReset();

      (skillRepository.findOne as jest.Mock)
        .mockResolvedValueOnce({
          ...mockSkillOffered,
          owner: { id: mockUser.id },
        })
        .mockResolvedValueOnce({
          ...mockSkillRequested,
          owner: { id: mockUser2.id },
        })
        .mockResolvedValueOnce({
          ...mockSkillRequested,
          owner: { id: mockUser2.id },
        });
      (userRepository.findOne as jest.Mock).mockResolvedValue({ ...mockUser2 });
      (requestRepository.findOne as jest.Mock).mockResolvedValue(null);
      (requestRepository.create as jest.Mock).mockReturnValue(mockRequest);
      (requestRepository.save as jest.Mock).mockResolvedValue(mockRequest);
      (userRepository.findOneBy as jest.Mock).mockResolvedValue({
        ...mockUser,
      });
    });

    it('должен успешно создать заявку', async () => {
      const result = await service.create(createRequestDto, mockUser.id);
      expect(result).toEqual(mockRequest);
      expect(skillRepository.findOne).toHaveBeenCalledTimes(3);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser2.id },
      });
      expect(skillRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockSkillRequested.id, owner: { id: mockUser2.id } },
      });
      expect(requestRepository.create).toHaveBeenCalledWith({
        sender: { id: mockUser.id },
        receiver: { id: mockUser2.id },
        offeredSkill: { id: mockSkillOffered.id },
        requestedSkill: { id: mockSkillRequested.id },
        status: RequestStatus.PENDING,
        isRead: false,
      });
      expect(requestRepository.save).toHaveBeenCalledWith(mockRequest);
      expect(notificationsGateway.notifyUser).toHaveBeenCalled();
    });

    it('должен выбросить BadRequestException если получатель не владеет запрашиваемым навыком', async () => {
      (skillRepository.findOne as jest.Mock).mockReset();
      (skillRepository.findOneBy as jest.Mock).mockReset();
      (skillRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(mockSkillOffered)
        .mockResolvedValueOnce(mockSkillRequested);
      (skillRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(
        service.create(createRequestDto, mockUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('должен выбросить NotFoundException если запрашиваемый навык не найден', async () => {
      (skillRepository.findOne as jest.Mock).mockReset();
      (skillRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(mockSkillOffered)
        .mockResolvedValueOnce(null);
      await expect(
        service.create(createRequestDto, mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('должен выбросить ForbiddenException если отправитель не владеет предлагаемым навыком', async () => {
      (skillRepository.findOne as jest.Mock).mockReset();
      const skillWithWrongOwner = {
        ...mockSkillOffered,
        owner: { ...mockUser, id: 'different-owner-id' } as User,
      };
      (skillRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(skillWithWrongOwner)
        .mockResolvedValueOnce(mockSkillRequested);
      await expect(
        service.create(createRequestDto, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('должен выбросить BadRequestException если получатель не владеет запрашиваемым навыком (дублирующий тест)', async () => {
      (skillRepository.findOne as jest.Mock).mockReset();
      (skillRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(mockSkillOffered)
        .mockResolvedValueOnce(mockSkillRequested)
        .mockResolvedValueOnce(null);
      await expect(
        service.create(createRequestDto, mockUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('должен выбросить BadRequestException при отправке заявки самому себе', async () => {
      (skillRepository.findOne as jest.Mock).mockReset();
      (userRepository.findOne as jest.Mock).mockReset();
      const selfSkill = { ...mockSkillRequested, owner: mockUser } as Skill;
      (skillRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(mockSkillOffered)
        .mockResolvedValueOnce(selfSkill);
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      await expect(
        service.create(createRequestDto, mockUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('должен выбросить BadRequestException при дублировании активной заявки', async () => {
      (requestRepository.findOne as jest.Mock).mockReset();
      (requestRepository.findOne as jest.Mock).mockResolvedValue(mockRequest);
      await expect(
        service.create(createRequestDto, mockUser.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findIncoming - получение входящих заявок', () => {
    it('должен вернуть входящие заявки', async () => {
      // Мокаем заявки с undefined связями и id
      const incomingRequests = [
        {
          ...mockRequest,
          sender: undefined,
          receiver: undefined,
          offeredSkill: undefined,
          requestedSkill: undefined,
          senderId: undefined,
          receiverId: undefined,
          offeredSkillId: undefined,
          requestedSkillId: undefined,
        },
      ];
      const findMock = requestRepository.find as jest.Mock;
      findMock.mockResolvedValue(incomingRequests);

      const result = await service.findIncoming(mockUser2.id);

      expect(result).toMatchObject(incomingRequests);
      expect(findMock).toHaveBeenCalledWith({
        where: {
          receiverId: mockUser2.id,
          status: RequestStatus.PENDING,
        },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOutgoing - получение исходящих заявок', () => {
    it('должен вернуть исходящие заявки', async () => {
      // Мокаем заявки с undefined связями и id
      const outgoingRequests = [
        {
          ...mockRequest,
          sender: undefined,
          receiver: undefined,
          offeredSkill: undefined,
          requestedSkill: undefined,
          senderId: undefined,
          receiverId: undefined,
          offeredSkillId: undefined,
          requestedSkillId: undefined,
        },
      ];
      const findMock = requestRepository.find as jest.Mock;
      findMock.mockResolvedValue(outgoingRequests);

      const result = await service.findOutgoing(mockUser.id);

      expect(result).toMatchObject(outgoingRequests);
      expect(findMock).toHaveBeenCalledWith({
        where: {
          senderId: mockUser.id,
          status: RequestStatus.PENDING,
        },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne - получение заявки по ID', () => {
    it('должен вернуть заявку если найдена', async () => {
      const findOneMock = requestRepository.findOne as jest.Mock;
      findOneMock.mockResolvedValue(mockRequest);

      const result = await service.findOne(mockRequest.id);

      expect(result).toEqual(mockRequest);
      expect(findOneMock).toHaveBeenCalledWith({
        where: { id: mockRequest.id },
        relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
      });
    });

    it('должен выбросить NotFoundException если заявка не найдена', async () => {
      const findOneMock = requestRepository.findOne as jest.Mock;
      findOneMock.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsRead - отметка как прочитанного', () => {
    beforeEach(() => {
      const findOneMock = requestRepository.findOne as jest.Mock;
      findOneMock.mockResolvedValue(mockRequest);

      const saveMock = requestRepository.save as jest.Mock;
      saveMock.mockResolvedValue({
        ...mockRequest,
        isRead: true,
      });
    });

    it('должен отметить заявку как прочитанную', async () => {
      const result = await service.markAsRead(mockRequest.id, mockUser2.id);

      expect(result.isRead).toBe(true);
      expect(requestRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isRead: true }),
      );
    });

    it('должен выбросить ForbiddenException если пользователь не является получателем', async () => {
      await expect(
        service.markAsRead(mockRequest.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('accept - принятие заявки', () => {
    beforeEach(() => {
      const findOneMock = requestRepository.findOne as jest.Mock;
      findOneMock.mockResolvedValue(mockRequest);

      const saveMock = requestRepository.save as jest.Mock;
      saveMock.mockResolvedValue({
        ...mockRequest,
        status: RequestStatus.ACCEPTED,
        isRead: true,
      });

      const findOneByUserMock = userRepository.findOneBy as jest.Mock;
      findOneByUserMock.mockResolvedValue(mockUser2);

      const findOneBySkillMock = skillRepository.findOneBy as jest.Mock;
      findOneBySkillMock.mockResolvedValue(mockSkillOffered);
    });

    it('должен принять заявку', async () => {
      const result = await service.accept(mockRequest.id, mockUser2.id);

      expect(result.status).toBe(RequestStatus.ACCEPTED);
      expect(result.isRead).toBe(true);
      expect(requestRepository.save).toHaveBeenCalled();
      expect(notificationsGateway.notifyUser).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ type: 'request_accepted' }),
      );
    });

    it('должен выбросить ForbiddenException если пользователь не является получателем', async () => {
      await expect(service.accept(mockRequest.id, mockUser.id)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('должен выбросить BadRequestException если заявка не в статусе PENDING', async () => {
      const nonPendingRequest = {
        ...mockRequest,
        status: RequestStatus.ACCEPTED,
      };
      const findOneMock = requestRepository.findOne as jest.Mock;
      findOneMock.mockResolvedValue(nonPendingRequest);

      await expect(
        service.accept(mockRequest.id, mockUser2.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject - отклонение заявки', () => {
    beforeEach(() => {
      const findOneMock = requestRepository.findOne as jest.Mock;
      findOneMock.mockResolvedValue(mockRequest);

      const saveMock = requestRepository.save as jest.Mock;
      saveMock.mockResolvedValue({
        ...mockRequest,
        status: RequestStatus.REJECTED,
        isRead: true,
      });

      const findOneByUserMock = userRepository.findOneBy as jest.Mock;
      findOneByUserMock.mockResolvedValue(mockUser2);

      const findOneBySkillMock = skillRepository.findOneBy as jest.Mock;
      findOneBySkillMock.mockResolvedValue(mockSkillOffered);
    });

    it('должен отклонить заявку', async () => {
      const result = await service.reject(mockRequest.id, mockUser2.id);

      expect(result.status).toBe(RequestStatus.REJECTED);
      expect(result.isRead).toBe(true);
      expect(requestRepository.save).toHaveBeenCalled();
      expect(notificationsGateway.notifyUser).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ type: 'request_rejected' }),
      );
    });

    it('должен выбросить ForbiddenException если пользователь не является получателем', async () => {
      await expect(service.reject(mockRequest.id, mockUser.id)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('должен выбросить BadRequestException если заявку нельзя отклонить', async () => {
      const nonRejectableRequest = {
        ...mockRequest,
        status: RequestStatus.REJECTED,
      };
      const findOneMock = requestRepository.findOne as jest.Mock;
      findOneMock.mockResolvedValue(nonRejectableRequest);

      await expect(
        service.reject(mockRequest.id, mockUser2.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove - удаление заявки', () => {
    beforeEach(() => {
      const findOneMock = requestRepository.findOne as jest.Mock;
      findOneMock.mockResolvedValue(mockRequest);

      const removeMock = requestRepository.remove as jest.Mock;
      removeMock.mockResolvedValue(undefined as never);
    });

    it('должен удалить заявку как отправитель', async () => {
      await service.remove(mockRequest.id, mockUser.id, false);

      expect(requestRepository.remove).toHaveBeenCalledWith(mockRequest);
    });

    it('должен удалить заявку как администратор', async () => {
      await service.remove(mockRequest.id, 'admin-id', true);

      expect(requestRepository.remove).toHaveBeenCalledWith(mockRequest);
    });

    it('должен выбросить ForbiddenException если не отправитель и не администратор', async () => {
      await expect(
        service.remove(mockRequest.id, 'stranger-id', false),
      ).rejects.toThrow(ForbiddenException);
    });

    it('должен выбросить BadRequestException если заявку нельзя удалить', async () => {
      const nonDeletableRequest = {
        ...mockRequest,
        status: 'COMPLETED' as RequestStatus,
      };
      const findOneMock = requestRepository.findOne as jest.Mock;
      findOneMock.mockResolvedValue(nonDeletableRequest);

      await expect(
        service.remove(mockRequest.id, mockUser.id, false),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update - обновление заявки', () => {
    beforeEach(() => {
      const findOneMock = requestRepository.findOne as jest.Mock;
      findOneMock.mockResolvedValue(mockRequest);

      const saveMock = requestRepository.save as jest.Mock;
      saveMock.mockImplementation((req) => Promise.resolve(req));
    });

    it('должен обновить статус как отправитель', async () => {
      const result = await service.update(
        mockRequest.id,
        { status: RequestStatus.ACCEPTED },
        mockUser.id,
      );

      expect(result.status).toBe(RequestStatus.ACCEPTED);
    });

    it('должен обновить isRead как получатель', async () => {
      const result = await service.update(
        mockRequest.id,
        { isRead: true },
        mockUser2.id,
      );

      expect(result.isRead).toBe(true);
    });

    it('должен выбросить ForbiddenException если не участник', async () => {
      await expect(
        service.update(mockRequest.id, updateRequestDto, 'stranger-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('должен выбросить ForbiddenException если не получатель пытается обновить isRead', async () => {
      await expect(
        service.update(
          mockRequest.id,
          { isRead: true },
          mockUser.id, // отправитель, не получатель
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('edge cases - граничные случаи', () => {
    it('должен обработать ошибку при создании заявки если отправитель не найден для уведомления', async () => {
      // Сброс всех моков
      (skillRepository.findOne as jest.Mock).mockReset();
      (skillRepository.findOneBy as jest.Mock).mockReset();
      (userRepository.findOne as jest.Mock).mockReset();
      (userRepository.findOneBy as jest.Mock).mockReset();
      (requestRepository.findOne as jest.Mock).mockReset();
      (requestRepository.create as jest.Mock).mockReset();
      (requestRepository.save as jest.Mock).mockReset();

      // Все проверки навыков проходят
      (skillRepository.findOne as jest.Mock)
        .mockResolvedValueOnce({
          ...mockSkillOffered,
          owner: { id: mockUser.id },
        })
        .mockResolvedValueOnce({
          ...mockSkillRequested,
          owner: { id: mockUser2.id },
        })
        .mockResolvedValueOnce({
          ...mockSkillRequested,
          owner: { id: mockUser2.id },
        });
      (userRepository.findOne as jest.Mock).mockResolvedValue({ ...mockUser2 });
      (requestRepository.findOne as jest.Mock).mockResolvedValue(null);
      (requestRepository.create as jest.Mock).mockReturnValue(mockRequest);
      (requestRepository.save as jest.Mock).mockResolvedValue(mockRequest);
      // Только для уведомления — отправитель не найден
      (userRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(
        service.create(createRequestDto, mockUser.id),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('должен обработать ошибку при принятии заявки если получатель не найден для уведомления', async () => {
      // Сброс всех моков
      (requestRepository.findOne as jest.Mock).mockReset();
      (requestRepository.save as jest.Mock).mockReset();
      (skillRepository.findOneBy as jest.Mock).mockReset();
      (userRepository.findOneBy as jest.Mock).mockReset();

      // Все проверки статуса и навыков проходят
      (requestRepository.findOne as jest.Mock).mockResolvedValue({
        ...mockRequest,
        status: RequestStatus.PENDING,
      });
      (requestRepository.save as jest.Mock).mockResolvedValue({
        ...mockRequest,
        status: RequestStatus.ACCEPTED,
        isRead: true,
      });
      (skillRepository.findOneBy as jest.Mock).mockResolvedValue({
        ...mockSkillOffered,
        owner: { id: mockUser.id },
      });
      // Только для уведомления — получатель не найден
      (userRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(
        service.accept(mockRequest.id, mockUser2.id),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('должен обработать null значения в отношениях', async () => {
      const requestWithNullRelations = {
        ...mockRequest,
        sender: null,
        receiver: null,
        offeredSkill: null,
        requestedSkill: null,
      };
      (requestRepository.findOne as jest.Mock).mockResolvedValue(
        requestWithNullRelations,
      );
      const result = await service.findOne(mockRequest.id);
      // Проверяем что не падает при null отношениях
      expect(result.sender).toBeNull();
      expect(result.receiver).toBeNull();
    });

    it('должен отправлять уведомление при создании заявки', async () => {
      (skillRepository.findOne as jest.Mock).mockReset();
      (skillRepository.findOneBy as jest.Mock).mockReset();
      (userRepository.findOne as jest.Mock).mockReset();
      (userRepository.findOneBy as jest.Mock).mockReset();
      (requestRepository.findOne as jest.Mock).mockReset();
      (requestRepository.create as jest.Mock).mockReset();
      (requestRepository.save as jest.Mock).mockReset();

      (skillRepository.findOne as jest.Mock)
        .mockResolvedValueOnce({
          ...mockSkillOffered,
          owner: { id: mockUser.id },
        })
        .mockResolvedValueOnce({
          ...mockSkillRequested,
          owner: { id: mockUser2.id },
        })
        .mockResolvedValueOnce({
          ...mockSkillRequested,
          owner: { id: mockUser2.id },
        });
      (userRepository.findOne as jest.Mock).mockResolvedValue({ ...mockUser2 });

      (requestRepository.findOne as jest.Mock).mockResolvedValue(null);
      (requestRepository.create as jest.Mock).mockReturnValue(mockRequest);
      (requestRepository.save as jest.Mock).mockResolvedValue(mockRequest);
      (userRepository.findOneBy as jest.Mock).mockResolvedValue({
        ...mockUser,
      });

      const result = await service.create(createRequestDto, mockUser.id);
      expect(result).toEqual(mockRequest);
      expect(notificationsGateway.notifyUser).toHaveBeenCalledWith(
        mockUser2.id,
        expect.objectContaining({
          type: 'new_request',
          fromUser: mockUser.name,
          skillName: mockSkillOffered.title,
        }),
      );
    });
  });
});
