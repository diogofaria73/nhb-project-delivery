import { Module } from '@nestjs/common';
import { CompaniesController } from './presentation/controllers/companies.controller';
import { CompanyPrismaRepository } from './infrastructure/repositories/company.prisma-repository';
import { COMPANY_REPOSITORY } from './domain/repositories/company.repository';
import {
  CreateCompanyUseCase,
  UpdateCompanyUseCase,
  ListCompaniesUseCase,
  FindCompanyUseCase,
  ToggleCompanyStatusUseCase,
} from './application/use-cases';

@Module({
  controllers: [CompaniesController],
  providers: [
    {
      provide: COMPANY_REPOSITORY,
      useClass: CompanyPrismaRepository,
    },
    CreateCompanyUseCase,
    UpdateCompanyUseCase,
    ListCompaniesUseCase,
    FindCompanyUseCase,
    ToggleCompanyStatusUseCase,
  ],
  exports: [COMPANY_REPOSITORY],
})
export class CompaniesModule {}
