import type {
  DashboardResponseDto,
  ImportListParams,
  ParseReportDto,
  ProjectDetailResponseDto,
  ProjectImportDetailDto,
  ProjectImportResponseDto,
} from '@nhb-status-report/shared';
import { apiClient } from './api-client';

interface PaginatedImports {
  data: ProjectImportResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async function sha256OfFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const projectTrackingService = {
  previewImport(file: File, referenceYear: number): Promise<ParseReportDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('referenceYear', String(referenceYear));
    return apiClient.postFormData<ParseReportDto>(
      '/project-tracking/imports/preview',
      formData,
    );
  },

  confirmImport(
    file: File,
    referenceYear: number,
    expectedSha256: string,
  ): Promise<{ importId: string; rowsAccepted: number; rowsRejected: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('referenceYear', String(referenceYear));
    formData.append('expectedSha256', expectedSha256);
    return apiClient.postFormData<{
      importId: string;
      rowsAccepted: number;
      rowsRejected: number;
    }>('/project-tracking/imports/confirm', formData);
  },

  listImports(params: ImportListParams = {}): Promise<PaginatedImports> {
    return apiClient.get<PaginatedImports>(
      '/project-tracking/imports',
      params as Record<string, unknown>,
    );
  },

  getImport(id: string): Promise<ProjectImportDetailDto> {
    return apiClient.get<ProjectImportDetailDto>(
      `/project-tracking/imports/${id}`,
    );
  },

  downloadFileUrl(id: string): string {
    return `/api/project-tracking/imports/${id}/file`;
  },

  async downloadFile(id: string): Promise<Blob> {
    return apiClient.getBlob(`/project-tracking/imports/${id}/file`);
  },

  restoreImport(id: string): Promise<void> {
    return apiClient.post<void>(`/project-tracking/imports/${id}/restore`, {});
  },

  deleteImport(id: string): Promise<void> {
    return apiClient.delete(`/project-tracking/imports/${id}`);
  },

  getDashboard(year?: number): Promise<DashboardResponseDto> {
    return apiClient.get<DashboardResponseDto>(
      '/project-tracking/dashboard',
      year ? { year } : {},
    );
  },

  getProjectDetail(snapshotId: string): Promise<ProjectDetailResponseDto> {
    return apiClient.get<ProjectDetailResponseDto>(
      `/project-tracking/projects/${snapshotId}`,
    );
  },

  sha256OfFile,
};
