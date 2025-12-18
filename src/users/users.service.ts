import { Injectable, ConflictException, NotFoundException, BadRequestException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RegisterDto } from "src/auth/dto/register-user.dto";
import { Repository } from "typeorm";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import { GenderOption, UserRole } from "./enums";
import * as bcrypt from 'bcrypt';
import { appConfig, AppConfig } from "src/config/app.config";
import { UpdatePasswordDto } from "./dto/update-password.dto";


@Injectable()
export class UsersService {
  constructor(
    @Inject(appConfig.KEY)
    private appConfig: AppConfig,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) { }


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
    return await this.usersRepository.findOneOrFail({
      where: { id },
    });
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
