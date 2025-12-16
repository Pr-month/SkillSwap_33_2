import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { TAuthResponse } from 'src/auth/types';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Patch('me')
  @UseGuards(JwtAccessGuard)
  updateMe(@Req() req: TAuthResponse, @Body() updateMeDto: UpdateUserDto) {
    const { sub } = req.user;

    // временная реализация без БД
    return this.usersService.updateCurrentUser(Number(sub), updateMeDto);
  }

  @Get('me')
  @UseGuards(JwtAccessGuard)
  getMe(@Req() req: TAuthResponse) {
    const { sub } = req.user;

    // временная реализация без БД
    return this.usersService.getCurrentUser(Number(sub));
  }

  @Patch('me/password')
  @UseGuards(JwtAccessGuard)
  updatePassword(
    @Req() req: TAuthResponse,
    @Body() updatePassword: UpdatePasswordDto,
  ) {
    const { sub } = req.user;

    // @todo: заменить на тип string
    return this.usersService.updatePassword(Number(sub), updatePassword);
  }
}
