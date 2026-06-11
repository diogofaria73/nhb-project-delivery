import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class DashboardQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2024)
  @Max(2099)
  year?: number;
}
