import { User } from '../entities/user.entity';
import { UserRole } from '../value-objects/user-role.vo';

export type { PaginationOptions, PaginatedResult } from '@shared/domain/pagination.interface';
import type { PaginationOptions, PaginatedResult } from '@shared/domain/pagination.interface';

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export const USER_REPOSITORY = 'IUserRepository';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(filters: UserFilters, pagination: PaginationOptions): Promise<PaginatedResult<User>>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  countActiveAdmins(): Promise<number>;
}
