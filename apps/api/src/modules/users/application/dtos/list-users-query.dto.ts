import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { PaginatedQueryDto } from '@shared/application/dtos/paginated-query.dto';

export class ListUsersQueryDto extends PaginatedQueryDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @IsString()
  @IsOptional()
  search?: string;
}
