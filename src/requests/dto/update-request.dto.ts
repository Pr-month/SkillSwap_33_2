import { PartialType } from '@nestjs/mapped-types';
import { CreateRequestDto } from './create-request.dto';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { RequestStatus } from '../request-status.enum';

export class UpdateRequestDto extends PartialType(CreateRequestDto) {
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  // Остальные поля наследуются от CreateRequestDto, но делаем их optional:
  // receiverId?: string;
  // offeredSkillId?: string;
  // requestedSkillId?: string;

  // Поля, которые НЕЛЬЗЯ обновлять через DTO:
  // id - никогда не обновляется
  // createdAt - никогда не обновляется
  // senderId - отправитель не меняется
  // sender - объект отправителя не меняется
  // receiver - объект получателя не меняется (меняется только receiverId)
}
