import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';
import { Category } from '../categories/entities/category.entity';
import { PaginationOptionsDto, OrderBy } from './dto/pagination-options.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private skillsRepository: Repository<Skill>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
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
    return await this.skillsRepository.save(skill);
  }

  findAll() {
    return `This action returns all skills`;
  }

  findOne(id: string) {
    return `This action returns a #${id} skill`;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const skill = await this.skillsRepository.findOne({
      relations: ['owner'],
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException(`Навык с ID ${id} не найден`);
    }

    if (!skill.owner || skill.owner.id !== userId) {
      throw new ForbiddenException('Вы можете удалять только свои навыки');
    }

    await this.skillsRepository.remove(skill);

    return { message: 'Навык успешно удален' };
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
    return this.skillsRepository.save({ ...skill, ...updateSkill });
  }
}
