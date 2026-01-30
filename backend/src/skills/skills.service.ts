import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { deleteFilesByUrls } from '../files/file.utils';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';
import { Category } from '../categories/entities/category.entity';
import { PaginationOptionsDto, OrderBy } from './dto/pagination-options.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private skillsRepository: Repository<Skill>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    createSkillDto: CreateSkillDto,
    ownerId: string,
  ): Promise<Skill> {
    // 1. Проверяем существование категории
    const category = await this.categoriesRepository.findOne({
      where: { id: createSkillDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Категория с ID ${createSkillDto.categoryId} не найдена`,
      );
    }

    // 2. Создаем навык с ownerId
    const skill = this.skillsRepository.create({
      ...createSkillDto,
      owner: { id: ownerId },
      category,
    });

    // 3. Сохраняем в БД
    const savedSkill = await this.skillsRepository.save(skill);

    return await this.skillsRepository.findOneOrFail({
      where: { id: savedSkill.id },
      relations: {
        owner: true,
        category: true,
      },
    });
  }

  // ... остальные методы пока остаются как есть
  findAll() {
    return `This action returns all skills`;
  }

  findOne(id: number) {
    return `This action returns a #${id} skill`;
  }

  async remove(userId: string, skillId: string): Promise<void> {
    // Находим навык с владельцем
    const skill = await this.skillsRepository.findOne({
      where: { id: skillId },
      relations: ['owner'],
    });

    if (!skill) {
      throw new NotFoundException('Навык не найден');
    }

    // Проверяем права доступа
    if (skill.owner.id !== userId) {
      throw new ForbiddenException('У вас нет прав для удаления этого навыка');
    }

    try {
      // Удаляем изображения из файловой системы
      if (skill.images && skill.images.length > 0) {
        deleteFilesByUrls(skill.images);
      }

      // Удаляем навык из БД
      await this.skillsRepository.remove(skill);
    } catch (error) {
      console.error('Ошибка при удалении навыка:', error);
      throw new BadRequestException('Не удалось удалить навык');
    }
  }

  async findSkills(paginationOptions: PaginationOptionsDto) {
    const { limit = 20, page = 1, order = OrderBy.DESC } = paginationOptions;

    const totalSkills = await this.skillsRepository.count();
    const totalPages = Math.ceil(totalSkills / limit);
    if (page > totalPages) {
      throw new NotFoundException('Page not found');
    }
    return this.skillsRepository.find({
      skip: (page - 1) * limit,
      take: limit,
      order: { updatedAt: order },
    });
  }

  async update(userId: string, skillId: string, updateSkill: UpdateSkillDto) {
    const skill = await this.skillsRepository.findOne({
      relations: {
        owner: true,
        category: true,
      },
      where: {
        id: skillId,
      },
    });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }
    if (skill.owner.id !== userId) {
      throw new ForbiddenException('Forbidden');
    }
    // Поиск категории по ID
    if (updateSkill.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: { id: updateSkill.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Категория с ID ${updateSkill.categoryId} не найдена`,
        );
      }

      skill.category = category;
      delete updateSkill.categoryId;
    }
    // Проверяем, передаются ли изображения в обновлении
    // Если поле images присутствует в updateSkill (даже если это пустой массив)
    if ('images' in updateSkill) {
      const oldImages = skill.images || [];
      const newImages = updateSkill.images || [];

      // Находим изображения, которые нужно удалить (есть в старых, но нет в новых)
      const imagesToDelete = oldImages.filter(
        (oldImage) => !newImages.includes(oldImage),
      );

      // Удаляем старые изображения, которые больше не используются
      if (imagesToDelete.length > 0) {
        deleteFilesByUrls(imagesToDelete);
      }
    }

    Object.assign(skill, updateSkill);
    return this.skillsRepository.save(skill);
  }

  async addToFavorites(skillId: string, userId: string): Promise<Skill> {
    // Находим навык с загруженными interestedUser
    const skill = await this.skillsRepository.findOne({
      where: { id: skillId },
      relations: ['interestedUser'],
    });

    if (!skill) {
      throw new NotFoundException('Навык не найден');
    }

    // Проверяем, есть ли уже пользователь в списке interestedUser
    const isAlreadyFavorite = skill.interestedUsers.some(
      (user) => user.id === userId,
    );

    if (isAlreadyFavorite) {
      throw new ConflictException('Навык уже в избранном');
    }

    // Находим пользователя
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Добавляем пользователя в список
    skill.interestedUsers.push(user);

    // Сохраняем изменения
    return await this.skillsRepository.save(skill);
  }

  async removeFromFavorites(skillId: string, userId: string): Promise<Skill> {
    // Находим навык с загруженными interestedUser
    const skill = await this.skillsRepository.findOne({
      where: { id: skillId },
      relations: ['interestedUser'],
    });

    if (!skill) {
      throw new NotFoundException('Навык не найден');
    }

    // Проверяем, есть ли пользователь в списке interestedUser
    const userIndex = skill.interestedUsers.findIndex(
      (user) => user.id === userId,
    );

    if (userIndex === -1) {
      throw new NotFoundException('Навык не найден в избранном');
    }

    // Удаляем пользователя из списка
    skill.interestedUsers.splice(userIndex, 1);

    // Сохраняем изменения
    return await this.skillsRepository.save(skill);
  }
}
