import { IsString, MinLength, ValidateIf } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(8, {
    message: 'Пароль должен содержать минимум 8 символов',
  })
  @ValidateIf((dto: CreateUserDto) => /[A-Z]/.test(dto.password), {
    message: 'Пароль должен содержать хотя бы одну заглавную букву.',
  })
  @ValidateIf((dto: CreateUserDto) => /\d/.test(dto.password), {
    message: 'Пароль должен содержать хотя бы одну цифру.',
  })
  @ValidateIf(
    (dto: CreateUserDto) => /[!@#$%^&*(),.?":{}|<>]/.test(dto.password),
    {
      message: 'Пароль должен содержать хотя бы один спецсимвол.',
    },
  )
  password: string;
}
