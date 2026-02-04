import { Test } from '@nestjs/testing';
import { SkillsService } from './skills.service';
import { Skill } from '../skills/entities/skill.entity';
import { Category } from '../categories/entities/category.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  OrderBy,
  PaginationOptionsDto,
} from '../skills/dto/pagination-options.dto';
import { UpdateSkillDto } from '../skills/dto/update-skill.dto';

describe('SkillsService', () => {
  let service: SkillsService;

  const mockUser: Partial<User> = {
    id: 'user-id',
    email: 'test@example.com',
  };

  const mockCategory: Partial<Category> = {
    id: 'cat-id',
    name: 'Test',
    parent: null,
    children: [],
    skills: [],
    usersWantedToLearn: [],
  };

  const mockSkill: Partial<Skill> = {
    id: 'skill-id',
    title: 'Test',
    description: 'Test',
    images: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    owner: mockUser as User,
    category: mockCategory as Category,
    interestedUsers: [],
  };

  const createSkillDto: CreateSkillDto = {
    title: 'New Skill',
    description: 'description',
    categoryId: 'categoryId',
  };

  const mockSkillsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockCategoriesRepository = {
    findOne: jest.fn(),
  };

  const mockUsersRepository = {
    findOne: jest.fn(),
  };

  const updateSkillDto: UpdateSkillDto = {
    title: 'Updated Skill',
    description: 'Updated Description',
    images: ['image1.jpg', 'image2.jpg'],
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SkillsService,
        {
          provide: getRepositoryToken(Skill),
          useValue: mockSkillsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoriesRepository,
        },
      ],
    }).compile();

    service = moduleRef.get<SkillsService>(SkillsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('должен успешно создать и вернуть навык', async () => {
      mockCategoriesRepository.findOne.mockResolvedValue(mockCategory);
      mockSkillsRepository.create.mockReturnValue(mockSkill);
      mockSkillsRepository.save.mockResolvedValue(mockSkill);
      mockSkillsRepository.findOneOrFail.mockResolvedValue(mockSkill);

      const result = await service.create(createSkillDto, 'user-id');

      expect(mockCategoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: createSkillDto.categoryId },
      });
      expect(mockSkillsRepository.create).toHaveBeenCalledWith({
        ...createSkillDto,
        owner: { id: 'user-id' },
        category: mockCategory,
      });
      expect(mockSkillsRepository.save).toHaveBeenCalledWith(mockSkill);
      expect(mockSkillsRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: mockSkill.id },
        relations: {
          owner: true,
          category: true,
        },
      });
      expect(result).toEqual(mockSkill);
    });

    it('должен выбросить NotFoundException если категория не найдена', async () => {
      mockCategoriesRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createSkillDto, 'user-id')).rejects.toThrow(
        new NotFoundException(
          `Категория с ID ${createSkillDto.categoryId} не найдена`,
        ),
      );
      expect(mockCategoriesRepository.findOne).toHaveBeenCalled();
      expect(mockSkillsRepository.create).not.toHaveBeenCalled();
      expect(mockSkillsRepository.save).not.toHaveBeenCalled();
    });
  });
  describe('findSkills', () => {
    const paginationOptions: PaginationOptionsDto = {
      page: 1,
      limit: 20,
      order: OrderBy.DESC,
    };

    it('должен вернуть список навыков с пагинацией', async () => {
      const totalSkills = 50;
      mockSkillsRepository.count.mockResolvedValue(totalSkills);
      mockSkillsRepository.find.mockResolvedValue([mockSkill]);

      const result = await service.findSkills(paginationOptions);

      expect(mockSkillsRepository.count).toHaveBeenCalled();
      expect(mockSkillsRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: paginationOptions.limit,
        order: { updatedAt: paginationOptions.order },
      });
      expect(result).toEqual([mockSkill]);
    });

    it('должен выбросить NotFoundException если страница не существует', async () => {
      const totalSkills = 20;
      const invalidPage = 3;
      const limit = 10;
      mockSkillsRepository.count.mockResolvedValue(totalSkills);

      await expect(
        service.findSkills({ page: invalidPage, limit }),
      ).rejects.toThrow(new NotFoundException('Page not found'));
      expect(mockSkillsRepository.find).not.toHaveBeenCalled();
    });

    it('должен корректно вычислять skip для страниц', async () => {
      const totalSkills = 50;
      mockSkillsRepository.count.mockResolvedValue(totalSkills);
      mockSkillsRepository.find.mockResolvedValue([mockSkill]);

      await service.findSkills({ page: 3, limit: 10 });

      expect(mockSkillsRepository.find).toHaveBeenCalledWith({
        skip: 20, // (3-1) * 10
        take: 10,
        order: { updatedAt: OrderBy.DESC },
      });
    });
    it('должен выбросить NotFoundException с нулевым количеством навыков', async () => {
      const totalSkills = 0;
      mockSkillsRepository.count.mockResolvedValue(totalSkills);
      mockSkillsRepository.find.mockResolvedValue([]);

      await expect(service.findSkills({ page: 1, limit: 10 })).rejects.toThrow(
        new NotFoundException('Page not found'),
      );
      expect(mockSkillsRepository.find).not.toHaveBeenCalled();
    });
  });
  describe('update', () => {
    it('должен обновить навык, если пользователь является владельцем', async () => {
      const existingSkill = {
        ...mockSkill,
        owner: { id: 'user-123' } as User,
        category: mockCategory as Category,
      };

      const updatedSkill = {
        ...existingSkill,
        ...updateSkillDto,
      };

      mockSkillsRepository.findOne.mockResolvedValue(existingSkill);
      mockSkillsRepository.save.mockResolvedValue(updatedSkill);

      const result = await service.update(
        'user-123',
        'skill-123',
        updateSkillDto,
      );

      expect(mockSkillsRepository.findOne).toHaveBeenCalledWith({
        relations: {
          owner: true,
          category: true,
        },
        where: { id: 'skill-123' },
      });

      expect(mockSkillsRepository.findOne).toHaveBeenCalledWith({
        relations: {
          owner: true,
          category: true,
        },
        where: { id: 'skill-123' },
      });

      expect(mockSkillsRepository.save).toHaveBeenCalledWith({
        ...existingSkill,
        ...updateSkillDto,
      });

      expect(result).toEqual(updatedSkill);
    });

    it('должен выбросить NotFoundException, если навык не найден', async () => {
      mockSkillsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('user-123', 'skill-123', updateSkillDto),
      ).rejects.toThrow(new NotFoundException('Skill not found'));
      expect(mockSkillsRepository.save).not.toHaveBeenCalled();
    });

    it('должен выбросить ForbiddenException, если пользователь не является владельцем', async () => {
      const existingSkill = {
        ...mockSkill,
        owner: { id: 'user-id' } as User,
      };

      mockSkillsRepository.findOne.mockResolvedValue(existingSkill);

      await expect(
        service.update('user-123', 'skill-123', updateSkillDto),
      ).rejects.toThrow(new ForbiddenException('Forbidden'));

      expect(mockSkillsRepository.save).not.toHaveBeenCalled();
    });
  });
});
