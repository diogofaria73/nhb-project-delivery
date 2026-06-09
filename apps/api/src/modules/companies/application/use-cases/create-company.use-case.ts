import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  COMPANY_REPOSITORY,
  ICompanyRepository,
} from '../../domain/repositories/company.repository';
import { Company } from '../../domain/entities/company.entity';
import { Cnpj } from '../../domain/value-objects/cnpj.vo';
import { CreateCompanyDto } from '../dtos/create-company.dto';
import { CompanyResponseDto } from '../dtos/company-response.dto';

@Injectable()
export class CreateCompanyUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async execute(dto: CreateCompanyDto): Promise<CompanyResponseDto> {
    const cnpj = Cnpj.create(dto.cnpj);

    const existing = await this.companyRepository.findByCnpj(cnpj.value);
    if (existing) {
      throw new ConflictException('CNPJ already registered');
    }

    const company = new Company({
      tradeName: dto.tradeName,
      legalName: dto.legalName,
      cnpj,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone ?? null,
      notes: dto.notes ?? null,
    });

    const created = await this.companyRepository.create(company);
    return CompanyResponseDto.fromEntity(created);
  }
}
