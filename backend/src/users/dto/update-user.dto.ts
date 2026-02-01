import {
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { GenderOption, UserRole } from '../enums';

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
  @IsString()
  avatar?: string;

  @IsOptional()
  role?: UserRole;

  @IsOptional()
  @IsString()
  wantToLearn?: string;
}
