import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  COMPANY_REPOSITORY,
  ICompanyRepository,
} from '../../domain/repositories/company.repository';
import { CompanyResponseDto } from '../dtos/company-response.dto';

@Injectable()
export class ToggleCompanyStatusUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async execute(id: string): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.isActive) {
      company.deactivate();
    } else {
      company.activate();
    }

    const updated = await this.companyRepository.update(company);
    return CompanyResponseDto.fromEntity(updated);
  }
}
