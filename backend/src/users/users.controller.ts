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
import {
  ApiFindUserById,
  ApiFindUsers,
  ApiFindUsersBySkill,
  ApiGetMe,
  ApiUpdateMe,
  ApiUpdatePassword,
  ApiUsersTag,
} from 'src/swagger/swagger.users';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

@ApiUsersTag()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiFindUsers()
  findAll(@Query() queryParams: FindUsersQueryDto) {
    logger.info('GET /users', { queryParams });
    return this.usersService.findAllFiltered({
      page: queryParams.page,
      limit: queryParams.limit,
      name: queryParams.name,
      email: queryParams.email,
      city: queryParams.city,
      role: queryParams.role,
      gender: queryParams.gender,
    });
  }

  @Get('me')
  @UseGuards(JwtAccessGuard)
  @ApiGetMe()
  getMe(@Req() req: TAuthResponse) {
    return this.usersService.getCurrentUser(req.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAccessGuard)
  @ApiUpdateMe()
  updateMe(@Req() req: TAuthResponse, @Body() updateMeDto: UpdateUserDto) {
    return this.usersService.updateCurrentUser(req.user.sub, updateMeDto);
  }

  @Patch('me/password')
  @UseGuards(JwtAccessGuard)
  @ApiUpdatePassword()
  updatePassword(
    @Req() req: TAuthResponse,
    @Body() updatePassword: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(req.user.sub, updatePassword);
  }

  @Get('by-skill/:id')
  @ApiFindUsersBySkill()
  findUsersBySimilarSkill(@Param('id') skillId: string) {
    return this.usersService.findUsersBySimilarSkill(skillId);
  }

  @Get(':id')
  @UseGuards(JwtAccessGuard)
  @ApiFindUserById()
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
