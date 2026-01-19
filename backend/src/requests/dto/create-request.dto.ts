import { IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Вспомогательные DTO для связей
class SkillReferenceDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

export class CreateRequestDto {
  @ValidateNested()
  @Type(() => SkillReferenceDto)
  @IsNotEmpty()
  offeredSkill: SkillReferenceDto;

  @ValidateNested()
  @Type(() => SkillReferenceDto)
  @IsNotEmpty()
  requestedSkill: SkillReferenceDto;
}
