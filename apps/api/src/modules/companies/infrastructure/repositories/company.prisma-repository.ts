import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import {
  CompanyFilters,
  ICompanyRepository,
  PaginatedResult,
  PaginationOptions,
} from '../../domain/repositories/company.repository';
import { Company } from '../../domain/entities/company.entity';
import { Cnpj } from '../../domain/value-objects/cnpj.vo';

@Injectable()
export class CompanyPrismaRepository implements ICompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Company | null> {
    const record = await this.prisma.company.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByCnpj(cnpj: string): Promise<Company | null> {
    const record = await this.prisma.company.findUnique({ where: { cnpj } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findAll(
    filters: CompanyFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Company>> {
    const where: Prisma.CompanyWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      const searchDigits = filters.search.replace(/\D/g, '');
      const conditions: Prisma.CompanyWhereInput[] = [
        { tradeName: { contains: filters.search, mode: 'insensitive' } },
        { legalName: { contains: filters.search, mode: 'insensitive' } },
        { contactEmail: { contains: filters.search, mode: 'insensitive' } },
      ];
      if (searchDigits.length > 0) {
        conditions.push({ cnpj: { contains: searchDigits } });
      }
      where.OR = conditions;
    }

    const [records, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data: records.map((r) => this.toDomain(r)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async create(company: Company): Promise<Company> {
    const record = await this.prisma.company.create({
      data: {
        id: company.id,
        tradeName: company.tradeName,
        legalName: company.legalName,
        cnpj: company.cnpj.value,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        notes: company.notes,
        isActive: company.isActive,
      },
    });
    return this.toDomain(record);
  }

  async update(company: Company): Promise<Company> {
    const record = await this.prisma.company.update({
      where: { id: company.id },
      data: {
        tradeName: company.tradeName,
        legalName: company.legalName,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        notes: company.notes,
        isActive: company.isActive,
      },
    });
    return this.toDomain(record);
  }

  private toDomain(record: {
    id: string;
    tradeName: string;
    legalName: string;
    cnpj: string;
    contactEmail: string;
    contactPhone: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Company {
    return new Company({
      id: record.id,
      tradeName: record.tradeName,
      legalName: record.legalName,
      cnpj: Cnpj.create(record.cnpj),
      contactEmail: record.contactEmail,
      contactPhone: record.contactPhone,
      notes: record.notes,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
