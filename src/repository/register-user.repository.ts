import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from '../auth/dto/register-user.dto';
import { RefreshToken } from '../entities/refreshToken.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private registerUserRepository: Repository<User>,

    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
  ) {}
  async createUser(registerDto: RegisterDto, hashedPassword: string) {
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

  async createRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<RefreshToken> {
    const user = await this.findUserById(userId);

    if (!user) {
      throw new Error(`Пользователь с ${userId} не найден`);
    }

    const tokenEntity = this.refreshTokensRepository.create({
      refreshToken,
      user,
    });

    return await this.refreshTokensRepository.save(tokenEntity);
  }
}
