import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { GenderOption, UserRole } from './enums';

@Injectable()
export class UsersService {
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async updateCurrentUser(id: number, updateData: UpdateUserDto) {
    if (id !== MOCK_USER.id) {
      throw new NotFoundException('User not found');
    }

    Object.assign(MOCK_USER, updateData);

    // Не возвращаем пароль и refreshToken
    // Возвращаем фиктивного пользователя
    // @todo: заменить на реальные данные из сущности User 
    const { password, refreshToken, ...safeUser } = MOCK_USER;
    return safeUser;
  }
    // @todo: заменить на обновление через репозиторий после создания UserEntity
  async getCurrentUser(id: number) {
    // @todo: заменить на запрос к БД после появления UserEntity и репозитория
    if (id !== MOCK_USER.id) {
      throw new NotFoundException('User not found');
    }
    // Не возвращаем пароль и refreshToken
    // Возвращаем фиктивного пользователя
    // @todo: заменить на реальные данные из сущности User 
    const { password, refreshToken, ...safeUser } = MOCK_USER;
    return safeUser;

  }

const MOCK_USER = {
  id: 1,
  name: 'Test User',
  email: 'test@mail.com',
  password: 'password',
  about: 'Test profile',
  birthdate: null,
  city: 'Moscow',
  gender: GenderOption.MALE,
  avatar: null,
  refreshToken: 'refresh_token_hash',
  role: UserRole.USER,
};
