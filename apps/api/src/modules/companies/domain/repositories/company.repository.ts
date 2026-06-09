import { Company } from '../entities/company.entity';

export type { PaginationOptions, PaginatedResult } from '@shared/domain/pagination.interface';
import type { PaginationOptions, PaginatedResult } from '@shared/domain/pagination.interface';

export interface CompanyFilters {
  isActive?: boolean;
  search?: string;
}

export const COMPANY_REPOSITORY = 'ICompanyRepository';

export interface ICompanyRepository {
  findById(id: string): Promise<Company | null>;
  findByCnpj(cnpj: string): Promise<Company | null>;
  findAll(filters: CompanyFilters, pagination: PaginationOptions): Promise<PaginatedResult<Company>>;
  create(company: Company): Promise<Company>;
  update(company: Company): Promise<Company>;
}
