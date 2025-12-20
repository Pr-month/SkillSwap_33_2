import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
  ParseBoolPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { TAuthResponse } from 'src/auth/types';
import { UserRole } from 'src/users/enums';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  async create(
    @Req() req: TAuthResponse,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Только администратор может создавать категории',
      );
    }
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll(
    @Query('includeAll', new DefaultValuePipe(false), ParseBoolPipe)
    includeAll?: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('search') search?: string,
  ) {
    return this.categoriesService.findAll({
      includeAll,
      page,
      limit,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  async update(
    @Req() req: TAuthResponse,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Только администратор может изменять категории',
      );
    }
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  async remove(@Req() req: TAuthResponse, @Param('id') id: string) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Только администратор может удалять категории',
      );
    }
    return this.categoriesService.remove(id);
  }
}
