import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';
import { Category } from '../categories/entities/category.entity';

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
      ownerId,
      category,
    });

    // 3. Сохраняем в БД
    return await this.skillsRepository.save(skill);
  }

  // ... остальные методы пока остаются как есть
  findAll() {
    return `This action returns all skills`;
  }

  findOne(id: number) {
    return `This action returns a #${id} skill`;
  }

  update(id: number, updateSkillDto: UpdateSkillDto) {
    return `This action updates a #${id} skill`;
  }

  remove(id: number) {
    return `This action removes a #${id} skill`;
  }
}
