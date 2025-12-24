import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { TAuthResponse } from 'src/auth/types';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

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
