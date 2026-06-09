import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { PaginatedQueryDto } from '@shared/application/dtos/paginated-query.dto';

export enum SubmissionStatusFilter {
  OnTime = 'on-time',
  Late = 'late',
}

export class ListSubmissionsQueryDto extends PaginatedQueryDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsEnum(SubmissionStatusFilter)
  status?: SubmissionStatusFilter;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  from?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  to?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  submittedById?: string;
}
