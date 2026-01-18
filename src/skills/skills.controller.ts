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
import {
  ApiAddToFavorites,
  ApiCreateSkill,
  ApiFindOneSkill,
  ApiFindSkills,
  ApiRemoveFromFavorites,
  ApiRemoveSkill,
  ApiSkillsTag,
  ApiUpdateSkill,
} from '../swagger/swagger.skills';

@ApiSkillsTag()
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  @ApiCreateSkill()
  create(@Body() createSkillDto: CreateSkillDto, @Req() req: TAuthResponse) {
    const ownerId = req.user.sub;
    return this.skillsService.create(createSkillDto, ownerId);
  }

  @Get(':id')
  @ApiFindOneSkill()
  findOne(@Param('id') id: string) {
    // данный метод вызывает this.skillsService.findOne(+id),
    // но в сервисе findOne ожидает number, а у нас ID навыка - это string (UUID). Это может быть проблемой
    return this.skillsService.findOne(+id);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRemoveSkill()
  async remove(@Param('id') id: string, @Req() req: TAuthResponse) {
    await this.skillsService.remove(req.user.sub, id);
  }

  @Get()
  @ApiFindSkills()
  findSkills(@Query() paginationOptions: PaginationOptionsDto) {
    return this.skillsService.findSkills(paginationOptions);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  @ApiUpdateSkill()
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
  @ApiRemoveFromFavorites()
  async removeFromFavorites(
    @Param('id') skillId: string,
    @Req() req: TAuthResponse,
  ) {
    await this.skillsService.removeFromFavorites(skillId, req.user.sub);
  }

  @Post(':id/favorites')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiAddToFavorites()
  addToFavorites(@Param('id') skillId: string, @Req() req: TAuthResponse) {
    return this.skillsService.addToFavorites(skillId, req.user.sub);
  }
}
