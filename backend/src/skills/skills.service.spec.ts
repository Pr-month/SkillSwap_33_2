import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SkillsService } from './skills.service';
import { Skill } from '../skills/entities/skill.entity';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import {
  OrderBy,
  PaginationOptionsDto,
} from '../skills/dto/pagination-options.dto';
import { UpdateSkillDto } from '../skills/dto/update-skill.dto';
import * as fileUtils from '../files/file.utils';

// Добавляем мок для утилиты удаления файлов
jest.mock('../files/file.utils', () => ({
  deleteFilesByUrls: jest.fn(),
}));

describe('SkillsService', () => {
  let service: SkillsService;
  let deleteFilesByUrlsMock: jest.Mock;

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
    remove: jest.fn(),
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
    deleteFilesByUrlsMock = fileUtils.deleteFilesByUrls as jest.Mock;

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
  describe('remove', () => {
    it('должен успешно удалить навык, если пользователь является владельцем', async () => {
      const skillToDelete = {
        ...mockSkill,
        id: 'skill-123',
        owner: { id: 'user-123' } as User,
        images: ['image1.jpg', 'image2.jpg'],
      };

      mockSkillsRepository.findOne.mockResolvedValue(skillToDelete);
      mockSkillsRepository.remove.mockResolvedValue(undefined);

      await service.remove('user-123', 'skill-123');

      expect(mockSkillsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'skill-123' },
        relations: ['owner'],
      });
      expect(deleteFilesByUrlsMock).toHaveBeenCalledWith([
        'image1.jpg',
        'image2.jpg',
      ]);
      expect(mockSkillsRepository.remove).toHaveBeenCalledWith(skillToDelete);
    });

    it('должен выбросить NotFoundException если навык не найден', async () => {
      mockSkillsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('user-123', 'skill-123')).rejects.toThrow(
        new NotFoundException('Навык не найден'),
      );
      expect(mockSkillsRepository.remove).not.toHaveBeenCalled();
      expect(deleteFilesByUrlsMock).not.toHaveBeenCalled();
    });

    it('должен выбросить ForbiddenException если пользователь не владелец', async () => {
      const skill = {
        ...mockSkill,
        owner: { id: 'owner-id' } as User,
      };

      mockSkillsRepository.findOne.mockResolvedValue(skill);

      await expect(service.remove('user-123', 'skill-123')).rejects.toThrow(
        new ForbiddenException('У вас нет прав для удаления этого навыка'),
      );
      expect(mockSkillsRepository.remove).not.toHaveBeenCalled();
    });

    it('должен не удалять файлы если у навыка нет изображений', async () => {
      const skillToDelete = {
        ...mockSkill,
        id: 'skill-123',
        owner: { id: 'user-123' } as User,
        images: [],
      };

      mockSkillsRepository.findOne.mockResolvedValue(skillToDelete);
      mockSkillsRepository.remove.mockResolvedValue(undefined);

      await service.remove('user-123', 'skill-123');

      expect(deleteFilesByUrlsMock).not.toHaveBeenCalled();
      expect(mockSkillsRepository.remove).toHaveBeenCalled();
    });

    it('должен выбросить BadRequestException при ошибке удаления', async () => {
      const skillToDelete = {
        ...mockSkill,
        id: 'skill-123',
        owner: { id: 'user-123' } as User,
        images: [],
      };

      // Мокаем console.error
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockSkillsRepository.findOne.mockResolvedValue(skillToDelete);
      mockSkillsRepository.remove.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.remove('user-123', 'skill-123')).rejects.toThrow(
        new BadRequestException('Не удалось удалить навык'),
      );

      // Проверяем, что console.error был вызван
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Ошибка при удалении навыка:',
        expect.any(Error),
      );

      expect(deleteFilesByUrlsMock).not.toHaveBeenCalled();

      // Восстанавливаем оригинальный console.error
      consoleErrorSpy.mockRestore();
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

    it('должен обновить категорию навыка', async () => {
      const newCategory: Partial<Category> = {
        id: 'new-cat-id',
        name: 'New Category',
      };

      const existingSkill = {
        ...mockSkill,
        owner: { id: 'user-123' } as User,
        category: mockCategory as Category,
      };

      mockSkillsRepository.findOne.mockResolvedValue(existingSkill);
      mockCategoriesRepository.findOne.mockResolvedValue(newCategory);
      mockSkillsRepository.save.mockResolvedValue({
        ...existingSkill,
        category: newCategory,
        title: 'Updated Skill',
      });

      const result = await service.update('user-123', 'skill-123', {
        title: 'Updated Skill',
        categoryId: 'new-cat-id',
      });

      expect(mockCategoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'new-cat-id' },
      });
      expect(mockSkillsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          category: newCategory,
          title: 'Updated Skill',
        }),
      );
      expect(result).toBeDefined();
    });

    it('должен выбросить NotFoundException при обновлении несуществующей категории', async () => {
      const existingSkill = {
        ...mockSkill,
        owner: { id: 'user-123' } as User,
        category: mockCategory as Category,
      };

      mockSkillsRepository.findOne.mockResolvedValue(existingSkill);
      mockCategoriesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('user-123', 'skill-123', {
          title: 'Updated',
          categoryId: 'non-existent',
        }),
      ).rejects.toThrow(
        new NotFoundException('Категория с ID non-existent не найдена'),
      );
      expect(mockSkillsRepository.save).not.toHaveBeenCalled();
    });

    it('должен удалить старые изображения при обновлении', async () => {
      const existingSkill = {
        ...mockSkill,
        owner: { id: 'user-123' } as User,
        images: ['old1.jpg', 'old2.jpg', 'old3.jpg'],
      };

      const updatedSkillData: UpdateSkillDto = {
        title: 'Updated',
        images: ['old1.jpg', 'new1.jpg'], // old2.jpg и old3.jpg должны быть удалены
      };

      mockSkillsRepository.findOne.mockResolvedValue(existingSkill);
      mockSkillsRepository.save.mockResolvedValue({
        ...existingSkill,
        ...updatedSkillData,
      });

      await service.update('user-123', 'skill-123', updatedSkillData);

      expect(deleteFilesByUrlsMock).toHaveBeenCalledWith([
        'old2.jpg',
        'old3.jpg',
      ]);
      expect(mockSkillsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          images: ['old1.jpg', 'new1.jpg'],
        }),
      );
    });

    it('должен удалить все изображения при передаче пустого массива', async () => {
      const existingSkill = {
        ...mockSkill,
        owner: { id: 'user-123' } as User,
        images: ['img1.jpg', 'img2.jpg'],
      };

      mockSkillsRepository.findOne.mockResolvedValue(existingSkill);
      mockSkillsRepository.save.mockResolvedValue({
        ...existingSkill,
        images: [],
      });

      await service.update('user-123', 'skill-123', { images: [] });

      expect(deleteFilesByUrlsMock).toHaveBeenCalledWith([
        'img1.jpg',
        'img2.jpg',
      ]);
      expect(mockSkillsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          images: [],
        }),
      );
    });

    it('должен не удалять изображения если они не изменены', async () => {
      const existingSkill = {
        ...mockSkill,
        owner: { id: 'user-123' } as User,
        images: ['img1.jpg', 'img2.jpg'],
      };

      const updatedSkillData: UpdateSkillDto = {
        title: 'Updated',
        images: ['img1.jpg', 'img2.jpg'], // те же самые изображения
      };

      mockSkillsRepository.findOne.mockResolvedValue(existingSkill);
      mockSkillsRepository.save.mockResolvedValue({
        ...existingSkill,
        ...updatedSkillData,
      });

      await service.update('user-123', 'skill-123', updatedSkillData);

      expect(deleteFilesByUrlsMock).not.toHaveBeenCalled();
      expect(mockSkillsRepository.save).toHaveBeenCalled();
    });
  });
  describe('addToFavorites', () => {
    it('должен добавить навык в избранное', async () => {
      const skill = {
        ...mockSkill,
        id: 'skill-123',
        interestedUsers: [],
      };

      mockSkillsRepository.findOne.mockResolvedValue(skill);
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockSkillsRepository.save.mockResolvedValue({
        ...skill,
        interestedUsers: [mockUser],
      });

      const result = await service.addToFavorites('skill-123', 'user-id');

      expect(mockSkillsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'skill-123' },
        relations: ['interestedUser'],
      });
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
      expect(mockSkillsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          interestedUsers: [mockUser],
        }),
      );
      expect(result).toBeDefined();
    });

    it('должен выбросить NotFoundException если навык не найден', async () => {
      mockSkillsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addToFavorites('non-existent', 'user-id'),
      ).rejects.toThrow(new NotFoundException('Навык не найден'));
      expect(mockUsersRepository.findOne).not.toHaveBeenCalled();
    });

    it('должен выбросить ConflictException если навык уже в избранном', async () => {
      const skill = {
        ...mockSkill,
        interestedUsers: [{ id: 'user-id' } as User],
      };

      mockSkillsRepository.findOne.mockResolvedValue(skill);

      await expect(
        service.addToFavorites('skill-123', 'user-id'),
      ).rejects.toThrow(new ConflictException('Навык уже в избранном'));
      expect(mockUsersRepository.findOne).not.toHaveBeenCalled();
    });

    it('должен выбросить NotFoundException если пользователь не найден', async () => {
      const skill = {
        ...mockSkill,
        interestedUsers: [],
      };

      mockSkillsRepository.findOne.mockResolvedValue(skill);
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addToFavorites('skill-123', 'non-existent-user'),
      ).rejects.toThrow(new NotFoundException('Пользователь не найден'));
      expect(mockSkillsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('removeFromFavorites', () => {
    it('должен удалить навык из избранного', async () => {
      const user1 = { id: 'user-1' } as User;
      const user2 = { id: 'user-2' } as User;

      const skill = {
        ...mockSkill,
        interestedUsers: [user1, user2],
      };

      mockSkillsRepository.findOne.mockResolvedValue(skill);
      mockSkillsRepository.save.mockResolvedValue({
        ...skill,
        interestedUsers: [user1],
      });

      const result = await service.removeFromFavorites('skill-123', 'user-2');

      expect(mockSkillsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'skill-123' },
        relations: ['interestedUser'],
      });
      expect(mockSkillsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          interestedUsers: [user1],
        }),
      );
      expect(result).toBeDefined();
    });

    it('должен выбросить NotFoundException если навык не найден', async () => {
      mockSkillsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeFromFavorites('non-existent', 'user-id'),
      ).rejects.toThrow(new NotFoundException('Навык не найден'));
    });

    it('должен выбросить NotFoundException если навык не в избранном', async () => {
      const skill = {
        ...mockSkill,
        interestedUsers: [],
      };

      mockSkillsRepository.findOne.mockResolvedValue(skill);

      await expect(
        service.removeFromFavorites('skill-123', 'user-id'),
      ).rejects.toThrow(new NotFoundException('Навык не найден в избранном'));
    });
  });

  describe('findAll', () => {
    it('должен вернуть заглушку для всех навыков', () => {
      const result = service.findAll();
      expect(result).toBe('This action returns all skills');
    });
  });

  describe('findOne', () => {
    it('должен вернуть заглушку для конкретного навыка', () => {
      const result = service.findOne(42);
      expect(result).toBe('This action returns a #42 skill');
    });

    it('должен корректно подставлять разные ID', () => {
      expect(service.findOne(1)).toBe('This action returns a #1 skill');
      expect(service.findOne(999)).toBe('This action returns a #999 skill');
      expect(service.findOne(0)).toBe('This action returns a #0 skill');
    });
  });
});
