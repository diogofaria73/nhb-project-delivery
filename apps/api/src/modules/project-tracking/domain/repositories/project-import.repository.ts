import type { ProjectImportStatus } from '@nhb-status-report/shared';

export const PROJECT_IMPORT_REPOSITORY = 'IProjectImportRepository';

export interface ProjectImportRecord {
  id: string;
  referenceYear: number;
  status: ProjectImportStatus;
  originalFilename: string;
  fileSizeBytes: number;
  sha256: string;
  storageKey: string;
  parseReport: unknown;
  rowsAccepted: number;
  rowsRejected: number;
  importedById: string;
  importedByName: string;
  importedAt: Date;
}

export interface ListImportsFilters {
  referenceYear?: number;
  status?: ProjectImportStatus;
}

export interface PaginatedImports {
  data: ProjectImportRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateImportInput {
  id: string;
  referenceYear: number;
  status: ProjectImportStatus;
  originalFilename: string;
  fileSizeBytes: number;
  sha256: string;
  storageKey: string;
  parseReport: unknown;
  rowsAccepted: number;
  rowsRejected: number;
  importedById: string;
}

export interface IProjectImportRepository {
  findById(id: string): Promise<ProjectImportRecord | null>;
  findActiveForYear(year: number): Promise<ProjectImportRecord | null>;
  list(
    filters: ListImportsFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedImports>;
  delete(id: string): Promise<void>;
}
