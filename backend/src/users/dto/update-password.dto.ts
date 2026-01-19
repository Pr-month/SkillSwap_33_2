import { PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdatePasswordDto extends PickType(CreateUserDto, ['password']) {
  @IsString()
  @MinLength(8, {
    message: 'Пароль должен содержать минимум 8 символов',
  })
  @ValidateIf((dto) => /[A-Z]/.test(dto.newPassword), {
    message: 'Добавьте хотя бы одну заглавную букву.',
  })
  @ValidateIf((dto) => /\d/.test(dto.newPassword), {
    message: 'Добавьте хотя бы одну цифру.',
  })
  @ValidateIf((dto) => /[!@#$%^&*(),.?":{}|<>]/.test(dto.newPassword), {
    message: 'Добавьте хотя бы один спецсимвол.',
  })
  newPassword: string;
}
