import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { TAuthResponse } from 'src/auth/types';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Patch,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import logger from 'src/config/winston.logger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('city') city?: string,
    @Query('role') role?: string,
    @Query('gender') gender?: string,
  ) {
    logger.info('GET /users', { page, limit, name, email, city, role, gender });
    return this.usersService.findAllFiltered({
      page: Number(page),
      limit: Number(limit),
      name,
      email,
      city,
      role,
      gender,
    });
  }

  @Get('me')
  @UseGuards(JwtAccessGuard)
  getMe(@Req() req: TAuthResponse) {
    return this.usersService.getCurrentUser(req.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAccessGuard)
  updateMe(@Req() req: TAuthResponse, @Body() updateMeDto: UpdateUserDto) {
    return this.usersService.updateCurrentUser(req.user.sub, updateMeDto);
  }

  @Patch('me/password')
  @UseGuards(JwtAccessGuard)
  updatePassword(
    @Req() req: TAuthResponse,
    @Body() updatePassword: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(req.user.sub, updatePassword);
  }

  @Get('by-skill/:id')
  findUsersBySimilarSkill(@Param('id') skillId: string) {
    return this.usersService.findUsersBySimilarSkill(skillId);
  }

  @Get(':id')
  @UseGuards(JwtAccessGuard)
  async findUser(@Param('id') id: string) {
    try {
      const user = await this.usersService.findUserById(id);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Пользователь не найден');
      }
      throw error;
    }
  }
}
