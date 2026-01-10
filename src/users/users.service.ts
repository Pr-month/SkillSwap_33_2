import logger from '../config/winston.logger';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../auth/dto/register-user.dto';
import { appConfig, AppConfig } from '../config/app.config';
import { Skill } from '../skills/entities/skill.entity';
import { Repository } from 'typeorm';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';


@Injectable()
export class UsersService {
  constructor(
    @Inject(appConfig.KEY)
    private appConfig: AppConfig,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
  ) {}

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find();
    return users;
  }

  async register(registerDto: RegisterDto) {
    const findUser = await this.findUserByEmail(registerDto.email);

    if (findUser) {
      throw new ConflictException(
        `Пользователь с ${registerDto.email} уже существует!`,
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.createUser(registerDto, hashedPassword);

    return user;
  }

  private async createUser(registerDto: RegisterDto, hashedPassword: string) {
    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });
    return await this.usersRepository.save(user);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findUserById(id: string) {
    try {
      const user = await this.usersRepository.findOneOrFail({ where: { id } });
      logger.info('User found', { id });
      return user;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('User not found', { id, error: errorMsg });
      throw error;
    }
  }

  async getCurrentUser(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateCurrentUser(
    id: string,
    updateData: UpdateUserDto,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateData);

    return this.usersRepository.save(user);
  }

  async updatePassword(id: string, updatePassword: UpdatePasswordDto) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedOldPassword = await bcrypt.hash(
      updatePassword.password,
      this.appConfig.hashSalt,
    );

    if (user.password !== hashedOldPassword) {
      throw new BadRequestException('Verification failed');
    }

    const hashedPassword = await bcrypt.hash(
      updatePassword.newPassword,
      this.appConfig.hashSalt,
    );

    return this.usersRepository.save({ ...user, password: hashedPassword });
  }

  async findUsersBySimilarSkill(skillId: string) {
    const skill = await this.skillsRepository.findOne({
      where: { id: skillId },
      relations: ['category'],
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    const categoryId = skill.category.id;

    const users = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.skills', 'skill')
      .leftJoin('skill.category', 'skillCategory')
      .leftJoin('user.wantToLearn', 'wantToLearn')
      .where('skillCategory.id = :categoryId', { categoryId })
      .orWhere('wantToLearn.id = :categoryId', { categoryId })
      .distinct(true)
      .take(10)
      .getMany();

    return users;
  }
  
  async findAllFiltered({
    page = 1,
    limit = 10,
    name,
    email,
    city,
    role,
    gender,
  }: {
    page?: number;
    limit?: number;
    name?: string;
    email?: string;
    city?: string;
    role?: string;
    gender?: string;
  }) {
    const query = this.usersRepository.createQueryBuilder('user');
    if (name) {
      query.andWhere('LOWER(user.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }
    if (email) {
      query.andWhere('LOWER(user.email) LIKE LOWER(:email)', {
        email: `%${email}%`,
      });
    }
    if (city) {
      query.andWhere('LOWER(user.city) LIKE LOWER(:city)', {
        city: `%${city}%`,
      });
    }
    if (role) {
      query.andWhere('user.role = :role', {
        role,
      });
    }
    if (gender) {
      query.andWhere('user.gender = :gender', {
        gender,
      });
    }
    const [users, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const lastPage = Math.ceil(total / limit);
    if (page > lastPage && total !== 0) {
      throw new ForbiddenException('Page number exceeds last page');
    }
    return {
      data: users,
      meta: {
        total,
        page,
        lastPage,
        limit,
      },
    };
  }
}
