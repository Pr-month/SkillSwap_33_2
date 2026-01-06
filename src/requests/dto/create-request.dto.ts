import {
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { RequestStatus } from '../request-status.enum';

export class CreateRequestDto {
  @IsUUID()
  @IsNotEmpty()
  receiverId: string;

  @IsUUID()
  @IsNotEmpty()
  offeredSkillId: string;

  @IsUUID()
  @IsNotEmpty()
  requestedSkillId: string;

  // Эти поля устанавливаются автоматически:
  // - id (генерируется БД)
  // - createdAt (устанавливается автоматически)
  // - senderId (берется из токена пользователя)
  // - status (по умолчанию PENDING)
  // - isRead (по умолчанию false)

  // Но если нужна возможность админу установить другие значения:
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsUUID()
  senderId?: string; // только для админов/тестирования

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
