import { Inject, Injectable } from '@nestjs/common';
import type {
  ParseReportDto,
  ProjectImportDetailDto,
} from '@nhb-status-report/shared';
import {
  IProjectImportRepository,
  PROJECT_IMPORT_REPOSITORY,
} from '../../domain/repositories/project-import.repository';
import { ImportNotFoundError } from '../../domain/errors/project-tracking.errors';

@Injectable()
export class GetImportUseCase {
  constructor(
    @Inject(PROJECT_IMPORT_REPOSITORY)
    private readonly repository: IProjectImportRepository,
  ) {}

  async execute(id: string): Promise<ProjectImportDetailDto> {
    const record = await this.repository.findById(id);
    if (!record) throw new ImportNotFoundError(id);
    return {
      id: record.id,
      referenceYear: record.referenceYear,
      status: record.status,
      originalFilename: record.originalFilename,
      fileSizeBytes: record.fileSizeBytes,
      sha256: record.sha256,
      rowsAccepted: record.rowsAccepted,
      rowsRejected: record.rowsRejected,
      importedById: record.importedById,
      importedByName: record.importedByName,
      importedAt: record.importedAt.toISOString(),
      parseReport: record.parseReport as ParseReportDto,
    };
  }
}
