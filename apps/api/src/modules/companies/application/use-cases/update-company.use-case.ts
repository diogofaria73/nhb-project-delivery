import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  COMPANY_REPOSITORY,
  ICompanyRepository,
} from '../../domain/repositories/company.repository';
import { UpdateCompanyDto } from '../dtos/update-company.dto';
import { CompanyResponseDto } from '../dtos/company-response.dto';

@Injectable()
export class UpdateCompanyUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async execute(id: string, dto: UpdateCompanyDto): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (dto.tradeName !== undefined) company.updateTradeName(dto.tradeName);
    if (dto.legalName !== undefined) company.updateLegalName(dto.legalName);
    if (dto.contactEmail !== undefined) company.updateContactEmail(dto.contactEmail);
    if (dto.contactPhone !== undefined) company.updateContactPhone(dto.contactPhone ?? null);
    if (dto.notes !== undefined) company.updateNotes(dto.notes ?? null);

    const updated = await this.companyRepository.update(company);
    return CompanyResponseDto.fromEntity(updated);
  }
}
