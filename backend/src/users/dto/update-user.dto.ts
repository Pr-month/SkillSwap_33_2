import {
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { GenderOption, UserRole } from '../enums';
import { Type } from 'class-transformer';
import { UpdateSkillDto } from 'src/skills/dto/update-skill.dto';
import { UpdateCategoryDto } from 'src/categories/dto/update-category.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsDate()
  birthdate?: Date;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  gender?: GenderOption;

  @IsOptional()
  avatar?: string;

  @IsOptional()
  role?: UserRole;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateSkillDto)
  skills?: UpdateSkillDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateCategoryDto)
  wantToLearn?: UpdateCategoryDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateSkillDto)
  favoriteSkills?: UpdateSkillDto[];
}
