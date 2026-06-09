import { Company } from '../../domain/entities/company.entity';

export class CompanyResponseDto {
  id!: string;
  tradeName!: string;
  legalName!: string;
  cnpj!: string;
  cnpjFormatted!: string;
  contactEmail!: string;
  contactPhone!: string | null;
  notes!: string | null;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(company: Company): CompanyResponseDto {
    const dto = new CompanyResponseDto();
    dto.id = company.id;
    dto.tradeName = company.tradeName;
    dto.legalName = company.legalName;
    dto.cnpj = company.cnpj.value;
    dto.cnpjFormatted = company.cnpj.format();
    dto.contactEmail = company.contactEmail;
    dto.contactPhone = company.contactPhone;
    dto.notes = company.notes;
    dto.isActive = company.isActive;
    dto.createdAt = company.createdAt;
    dto.updatedAt = company.updatedAt;
    return dto;
  }
}
