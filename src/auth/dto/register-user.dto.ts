import {
  IsDateString,
  IsDefined,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GenderOption } from '../../users/enums';

export class RegisterDto {
  @IsEmail()
  @IsDefined()
  email: string; //

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Пароль должен быть на латинице, а так же содержать как минимум одну заглавную букву, одну строчную букву и одну цифру',
  })
  password: string; //

  @IsString()
  @IsDefined()
  @MinLength(2)
  name: string; //

  @IsDateString()
  @IsISO8601()
  @IsNotEmpty()
  birthdate: string; //

  @IsEnum(GenderOption)
  @IsNotEmpty()
  gender: GenderOption; //

  @IsString()
  city: string; //

  @IsString()
  about: string; //
}
