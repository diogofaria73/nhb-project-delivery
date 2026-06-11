import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

const STATUSES = ['PENDING', 'PROCESSING', 'ACTIVE', 'SUPERSEDED', 'FAILED'] as const;
type ImportStatusEnum = (typeof STATUSES)[number];

export class ListImportsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2024)
  @Max(2099)
  year?: number;

  @IsOptional()
  @IsEnum(STATUSES)
  status?: ImportStatusEnum;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
