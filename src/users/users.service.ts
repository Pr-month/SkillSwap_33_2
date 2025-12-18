import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RegisterDto } from "src/auth/dto/register-user.dto";
import { Repository } from "typeorm";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import { GenderOption, UserRole } from "./enums";
import * as bcrypt from 'bcrypt';

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
    return await this.registerUserRepository.findOneOrFail({
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
