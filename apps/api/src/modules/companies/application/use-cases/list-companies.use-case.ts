import { Inject, Injectable } from '@nestjs/common';
import {
  COMPANY_REPOSITORY,
  ICompanyRepository,
  PaginatedResult,
} from '../../domain/repositories/company.repository';
import { ListCompaniesQueryDto } from '../dtos/list-companies-query.dto';
import { CompanyResponseDto } from '../dtos/company-response.dto';

@Injectable()
export class ListCompaniesUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async execute(
    query: ListCompaniesQueryDto,
  ): Promise<PaginatedResult<CompanyResponseDto>> {
    const result = await this.companyRepository.findAll(
      {
        isActive: query.isActive,
        search: query.search,
      },
      {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      },
    );

    return {
      data: result.data.map(CompanyResponseDto.fromEntity),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
