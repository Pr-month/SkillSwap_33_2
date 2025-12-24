import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { TAuthResponse } from 'src/auth/types';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
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
  findUser(@Param('id') id: string) {
    return this.usersService.findUserById(id);
  }
}
