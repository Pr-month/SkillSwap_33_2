import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { GenderOption, UserRole } from '../enums';

export class FindUsersQueryDto {
  @ApiProperty({
    required: false,
    description: 'Номер страницы',
    default: 1,
    type: Number,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' || typeof value === 'number') {
      return parseInt(String(value), 10);
    }
    return 1;
  })
  @IsNumber()
  @Min(1)
  readonly page?: number = 1;

  @ApiProperty({
    required: false,
    description: 'Количество записей на странице',
    default: 10,
    type: Number,
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' || typeof value === 'number') {
      return parseInt(String(value), 10);
    }
    return 10;
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  readonly limit?: number = 10;

  @ApiProperty({
    required: false,
    description: 'Фильтр по имени пользователя',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly name?: string;

  @ApiProperty({
    required: false,
    description: 'Фильтр по email',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly email?: string;

  @ApiProperty({
    required: false,
    description: 'Фильтр по городу',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly city?: string;

  @ApiProperty({
    required: false,
    description: 'Фильтр по роли',
    enum: UserRole,
    enumName: 'UserRole',
  })
  @IsOptional()
  @IsEnum(UserRole)
  readonly role?: UserRole;

  @ApiProperty({
    required: false,
    description: 'Фильтр по гендеру',
    enum: GenderOption,
    enumName: 'GenderOption',
  })
  @IsOptional()
  @IsEnum(GenderOption)
  readonly gender?: GenderOption;
}
