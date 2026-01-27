import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { GenderOption } from '../enums';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Иван Иванов',
    description: 'Имя пользователя',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  @MaxLength(50, { message: 'Имя не должно превышать 50 символов' })
  name?: string;

  @ApiPropertyOptional({
    example: 'ivan@example.com',
    description: 'Email пользователя',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Некорректный формат email' })
  email?: string;

  @ApiPropertyOptional({
    example: '1990-01-01',
    description: 'Дата рождения в формате ISO 8601',
  })
  @IsOptional()
  @IsDateString()
  birthdate?: Date;

  @ApiPropertyOptional({
    enum: GenderOption,
    example: GenderOption.MALE,
    description: 'Пол пользователя',
  })
  @IsOptional()
  @IsEnum(GenderOption, { message: 'Некорректное значение пола' })
  gender?: GenderOption;

  @ApiPropertyOptional({
    example: 'Москва',
    description: 'Город проживания',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'Название города не должно превышать 100 символов',
  })
  city?: string;

  @ApiPropertyOptional({
    example: 'Опытный разработчик с 10-летним стажем',
    description: 'О себе',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Описание не должно превышать 1000 символов' })
  about?: string;
}
