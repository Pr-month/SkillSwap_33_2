import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  MaxLength,
  MinLength,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Название должно быть не менее 3 символов' })
  @MaxLength(100, { message: 'Название должно быть не более 100 символов' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Описание должно быть не менее 10 символов' })
  @MaxLength(1000, { message: 'Описание должно быть не более 1000 символов' })
  description: string;

  @IsArray({ message: 'Изображения должны быть массивом' })
  @ArrayMinSize(1, { message: 'Должно быть хотя бы одно изображение' })
  @IsString({ each: true, message: 'Каждая ссылка должна быть строкой' })
  @IsOptional()
  images?: string[];

  @IsUUID('4', { message: 'ID категории должен быть валидным UUID' })
  @IsNotEmpty({ message: 'ID категории обязателен' })
  categoryId: string;
}
