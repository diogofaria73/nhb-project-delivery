import { Inject, Injectable } from '@nestjs/common';
import type {
  ProjectImportResponseDto,
  ProjectImportStatus,
} from '@nhb-status-report/shared';
import {
  IProjectImportRepository,
  PROJECT_IMPORT_REPOSITORY,
} from '../../domain/repositories/project-import.repository';

export interface ListImportsInput {
  year?: number;
  status?: ProjectImportStatus;
  page?: number;
  limit?: number;
}

export interface ListImportsOutput {
  data: ProjectImportResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ListImportsUseCase {
  constructor(
    @Inject(PROJECT_IMPORT_REPOSITORY)
    private readonly repository: IProjectImportRepository,
  ) {}

  async execute(input: ListImportsInput): Promise<ListImportsOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const result = await this.repository.list(
      { referenceYear: input.year, status: input.status },
      page,
      limit,
    );
    return {
      ...result,
      data: result.data.map((row) => ({
        id: row.id,
        referenceYear: row.referenceYear,
        status: row.status,
        originalFilename: row.originalFilename,
        fileSizeBytes: row.fileSizeBytes,
        sha256: row.sha256,
        rowsAccepted: row.rowsAccepted,
        rowsRejected: row.rowsRejected,
        importedById: row.importedById,
        importedByName: row.importedByName,
        importedAt: row.importedAt.toISOString(),
      })),
    };
  }
}
