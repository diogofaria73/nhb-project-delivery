import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginatedQueryDto } from '@shared/application/dtos/paginated-query.dto';

export class ListCompaniesQueryDto extends PaginatedQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @IsString()
  @IsOptional()
  search?: string;
}
