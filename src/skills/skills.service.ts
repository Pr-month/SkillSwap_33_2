import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { Repository } from 'typeorm';
import { OrderBy, PaginationOptionsDto } from './dto/pagination-options.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
  ) {}

  create(createSkillDto: CreateSkillDto) {
    return 'This action adds a new skill';
  }

  findAll() {
    return `This action returns all skills`;
  }

  findOne(id: number) {
    return `This action returns a #${id} skill`;
  }

  remove(id: number) {
    return `This action removes a #${id} skill`;
  }

  async findSkills(paginationOptions: PaginationOptionsDto) {
    const { limit = 20, page = 1, order = OrderBy.DESC } = paginationOptions;
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
