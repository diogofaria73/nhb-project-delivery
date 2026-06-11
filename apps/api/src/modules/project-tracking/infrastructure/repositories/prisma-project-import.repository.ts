import { Injectable } from '@nestjs/common';
import type { ProjectImportStatus } from '@nhb-status-report/shared';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import {
  IProjectImportRepository,
  ListImportsFilters,
  PaginatedImports,
  ProjectImportRecord,
} from '../../domain/repositories/project-import.repository';

@Injectable()
export class PrismaProjectImportRepository implements IProjectImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ProjectImportRecord | null> {
    const row = await this.prisma.projectImport.findUnique({
      where: { id },
      include: { importedBy: { select: { name: true } } },
    });
    return row ? this.toRecord(row) : null;
  }

  async findActiveForYear(year: number): Promise<ProjectImportRecord | null> {
    const row = await this.prisma.projectImport.findFirst({
      where: { referenceYear: year, status: 'ACTIVE' },
      include: { importedBy: { select: { name: true } } },
    });
    return row ? this.toRecord(row) : null;
  }

  async list(
    filters: ListImportsFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedImports> {
    const where = {
      ...(filters.referenceYear !== undefined
        ? { referenceYear: filters.referenceYear }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.projectImport.findMany({
        where,
        orderBy: { importedAt: 'desc' },
        skip,
        take: limit,
        include: { importedBy: { select: { name: true } } },
      }),
      this.prisma.projectImport.count({ where }),
    ]);
    return {
      data: rows.map((row) => this.toRecord(row)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.projectImport.delete({ where: { id } });
  }

  private toRecord(row: {
    id: string;
    referenceYear: number;
    status: string;
    originalFilename: string;
    fileSizeBytes: number;
    sha256: string;
    storageKey: string;
    parseReport: unknown;
    rowsAccepted: number;
    rowsRejected: number;
    importedById: string;
    importedAt: Date;
    importedBy: { name: string } | null;
  }): ProjectImportRecord {
    return {
      id: row.id,
      referenceYear: row.referenceYear,
      status: row.status as ProjectImportStatus,
      originalFilename: row.originalFilename,
      fileSizeBytes: row.fileSizeBytes,
      sha256: row.sha256,
      storageKey: row.storageKey,
      parseReport: row.parseReport,
      rowsAccepted: row.rowsAccepted,
      rowsRejected: row.rowsRejected,
      importedById: row.importedById,
      importedByName: row.importedBy?.name ?? 'Unknown',
      importedAt: row.importedAt,
    };
  }
}
