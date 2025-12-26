import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { TAuthResponse } from 'src/auth/types';
import { PaginationOptionsDto } from './dto/pagination-options.dto';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  create(@Body() createSkillDto: CreateSkillDto, @Req() req: TAuthResponse) {
    const ownerId = req.user.sub;

    return this.skillsService.create(createSkillDto, ownerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skillsService.remove(+id);
  }

  @Get()
  findSkills(@Query() paginationOptions: PaginationOptionsDto) {
    return this.skillsService.findSkills(paginationOptions);
  }

  @UseGuards(JwtAccessGuard)
  @Patch(':id')
  update(
    @Req() req: TAuthResponse,
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
  ) {
    return this.skillsService.update(req.user.sub, id, updateSkillDto);
  }

  @Delete(':id/favorites')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromFavorites(
    @Param('id') skillId: string,
    @Req() req: TAuthResponse,
  ) {
    await this.skillsService.removeFromFavorites(skillId, req.user.sub);
  }
  
  @Post(':id/favorites')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  addToFavorites(@Param('id') skillId: string, @Req() req: TAuthResponse) {
    return this.skillsService.addToFavorites(skillId, req.user.sub);
  }
}
