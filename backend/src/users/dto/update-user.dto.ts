import {
  IsDate,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { GenderOption, UserRole } from '../enums';
import { Type } from 'class-transformer';

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
  @Type(() => Date)
  @IsDate()
  birthdate?: Date;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  gender?: GenderOption;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  role?: UserRole;

  @IsOptional()
  @IsString()
  wantToLearn?: string;
}
