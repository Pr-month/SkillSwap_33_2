import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmEmailDto {
  @ApiProperty({ description: 'JWT токен подтверждения email' })
  @IsString({ message: 'Токен должен быть строкой' })
  @IsNotEmpty({ message: 'Токен не может быть пустым' })
  token: string;
}
