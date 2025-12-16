import {
  IsArray,
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ParentSkill } from '../../types/skill.type';
import { GenderOption } from '../../users/enums';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Пароль должен быть на латинице, а так же содержать как минимум одну заглавную букву, одну строчную букву и одну цифру',
  })
  password: string;

  @IsEnum(ParentSkill, { each: true })
  @IsArray()
  skill: ParentSkill[];

  @IsString({ each: true })
  @IsArray()
  subSkill: string[];

  @IsEnum(ParentSkill, { each: true })
  @IsArray()
  skillToTeach: ParentSkill[];

  @IsString({ each: true })
  @IsArray()
  subSkillToTeach: string[];

  @IsString()
  username: string;

  @IsDateString()
  @IsISO8601()
  birthday: string;

  @IsEnum(GenderOption)
  gender: GenderOption;

  @IsString()
  city: string;

  @IsString()
  descriptionSkillToTeach: string;
}
