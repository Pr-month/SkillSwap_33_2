import { IsString, MinLength, ValidateIf } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(8, {
    message: 'Пароль должен содержать минимум 8 символов',
  })
  @ValidateIf((dto) => /[A-Z]/.test(dto.newPassword), {
    message: 'Пароль должен содержать хотя бы одну заглавную букву.',
  })
  @ValidateIf((dto) => /\d/.test(dto.newPassword), {
    message: 'Пароль должен содержать хотя бы одну цифру.',
  })
  @ValidateIf((dto) => /[!@#$%^&*(),.?":{}|<>]/.test(dto.newPassword), {
    message: 'Пароль должен содержать хотя бы один спецсимвол.',
  })
  password: string;
}
