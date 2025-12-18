import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GenderOption, UserRole } from './enums';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';
import { type AppConfig, appConfig } from 'src/config/app.config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @Inject(appConfig.KEY)
    private appConfig: AppConfig,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async getCurrentUser(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateCurrentUser(id: string, updateData: UpdateUserDto) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersRepository.save({ ...user, ...updateData });
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
}
