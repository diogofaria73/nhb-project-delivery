import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class AnalyticsRangeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  from!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  to!: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
