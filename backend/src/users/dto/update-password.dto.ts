import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ description: 'Новый пароль' })
  @IsString()
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Пароль должен содержать хотя бы одну заглавную букву',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Пароль должен содержать хотя бы одну цифру',
  })
  @Matches(/(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message: 'Пароль должен содержать хотя бы один спецсимвол',
  })
  newPassword: string;
}
