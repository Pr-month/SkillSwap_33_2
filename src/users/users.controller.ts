import { Body, Controller, Delete, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { TAuthResponse } from 'src/auth/types';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findUser(@Param('id') id: string) {
    return this.usersService.findUserById(id);
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
}
