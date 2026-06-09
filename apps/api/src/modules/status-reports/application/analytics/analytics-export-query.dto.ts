import { IsEnum, IsOptional } from 'class-validator';
import { AnalyticsRangeDto } from './analytics-range.dto';

export enum ExportKind {
  Flat = 'flat',
  Summary = 'summary',
}

export class AnalyticsExportQueryDto extends AnalyticsRangeDto {
  @IsOptional()
  @IsEnum(ExportKind)
  kind?: ExportKind;
}
