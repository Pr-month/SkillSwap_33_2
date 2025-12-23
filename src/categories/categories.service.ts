import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, FindOptionsWhere } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, parentId } = createCategoryDto;

    // Проверка уникальности на одном уровне
    const where: FindOptionsWhere<Category> = { name };
    if (parentId) {
      where.parent = { id: parentId };
    } else {
      where.parent = IsNull();
    }

    const existing = await this.categoriesRepository.findOne({
      where,
    });
    if (existing) {
      throw new BadRequestException('Категория с таким именем уже существует');
    }

    let parent: Category | null = null;
    if (parentId) {
      parent = await this.categoriesRepository.findOne({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException('Родительская категория не найдена');
      }
    }

    const category = this.categoriesRepository.create({ name, parent });
    return this.categoriesRepository.save(category);
  }

  async findAll(options?: {
    includeAll?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { includeAll = false, page = 1, limit = 20, search } = options || {};

    const query = this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.children', 'children')
      .orderBy('category.name', 'ASC');

    if (!includeAll) {
      query.where('category.parent IS NULL');
    }

    if (search) {
      query.andWhere('category.name ILIKE :search', { search: `%${search}%` });
    }

    if (page && limit) {
      query.skip((page - 1) * limit).take(limit);
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['children', 'parent'],
    });
    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    const { name, parentId } = updateCategoryDto;

    // Обновление имени категории
    if (name !== undefined && name !== category.name) {
      const where: FindOptionsWhere<Category> = { name };
      const currentParentId = category.parent?.id || null;
      if (parentId !== undefined) {
        // Если меняем родителя - проверяем у нового родителя
        where.parent = parentId ? { id: parentId } : IsNull();
      } else {
        // Если родителя не меняем - проверяем у текущего
        where.parent = currentParentId ? { id: currentParentId } : IsNull();
      }

      const existing = await this.categoriesRepository.findOne({
        where,
        withDeleted: false,
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException(
          'Категория с таким именем уже существует на этом уровне',
        );
      }
      category.name = name;
    }

    // Обновление родителя категории
    if (parentId !== undefined) {
      const currentParentId = category.parent?.id || null;

      if (parentId === currentParentId) {
        // Родитель не изменился
      } else if (parentId === null) {
        // Становимся корневой категорией
        category.parent = null;
      } else {
        // Меняем родителя
        if (parentId === id) {
          throw new BadRequestException(
            'Категория не может быть родителем самой себя',
          );
        }

        // Проверка циклической зависимости (глубокая)
        const isDescendant = await this.isDescendant(parentId, id);
        if (isDescendant) {
          throw new BadRequestException(
            'Нельзя сделать родителем дочернюю категорию',
          );
        }

        const parent = await this.categoriesRepository.findOne({
          where: { id: parentId },
        });
        if (!parent) {
          throw new NotFoundException('Родительская категория не найдена');
        }
        category.parent = parent;
      }
    }

    return this.categoriesRepository.save(category);
  }

  async remove(id: string) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['children'],
    });
    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    // Предупреждение, если есть дети
    if (category.children && category.children.length > 0) {
      throw new BadRequestException(
        'Нельзя удалить категорию с подкатегориями. ' +
          'Сначала удалите или переместите подкатегории.',
      );
    }

    await this.categoriesRepository.remove(category);
    return { deleted: true, id };
  }

  private async isDescendant(
    potentialDescendantId: string,
    ancestorId: string,
  ): Promise<boolean> {
    let currentId = potentialDescendantId;

    while (currentId) {
      const category = await this.categoriesRepository.findOne({
        where: { id: currentId },
        relations: ['parent'],
      });

      if (!category?.parent) {
        break;
      }

      if (category.parent.id === ancestorId) {
        return true;
      }

      currentId = category.parent.id;
    }

    return false;
  }
}
