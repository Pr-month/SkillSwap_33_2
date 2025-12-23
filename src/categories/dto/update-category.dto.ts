import {
  IsNotEmpty,
  IsOptional,
  Length,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString({ message: 'Название должно быть строкой' })
  @IsNotEmpty({ message: 'Название не может быть пустым' })
  @Length(2, 100, { message: 'Название должно быть от 2 до 100 символов' })
  @Matches(/^[\p{L}\p{N}\s\-_]+$/u, {
    message:
      'Название может содержать только буквы, цифры, пробелы, дефисы и подчеркивания',
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Некорректный формат ID родительской категории' })
  parentId?: string | null;
}
