import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';

export enum OrderBy {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationOptionsDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  readonly page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(100)
  readonly limit?: number;

  @IsOptional()
  @IsEnum(OrderBy)
  readonly order?: OrderBy;
}
