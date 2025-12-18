import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private registerUserRepository: Repository<User>,
  ) {}
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
    const user = this.registerUserRepository.create({
      ...registerDto,
      password: hashedPassword,
    });
    return await this.registerUserRepository.save(user);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.registerUserRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findUserById(id: string) {
    return await this.registerUserRepository.findOne({
      where: { id },
    });
  }

  remove(arg0: number) {
    throw new Error('Method not implemented.');
  }
  update(arg0: number, updateUserDto: UpdateUserDto) {
    throw new Error('Method not implemented.');
  }

  findAll() {
    throw new Error('Method not implemented.');
  }
}
