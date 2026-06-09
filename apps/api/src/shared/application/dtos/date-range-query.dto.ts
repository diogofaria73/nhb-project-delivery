import { IsOptional, IsDateString } from 'class-validator';

export class DateRangeQueryDto {
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}
