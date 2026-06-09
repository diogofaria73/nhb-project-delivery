import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AnalyticsRangeDto } from './analytics-range.dto';

export enum ComplianceBand {
  Green = 'green',
  Amber = 'amber',
  Red = 'red',
}

export class AnalyticsCompaniesQueryDto extends AnalyticsRangeDto {
  @IsOptional()
  @IsEnum(ComplianceBand)
  band?: ComplianceBand;

  @IsOptional()
  @IsString()
  search?: string;
}
