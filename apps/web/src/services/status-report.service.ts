import { apiClient } from './api-client';
import type {
  SubmissionResponse,
  CreateSubmissionPayload,
  UpdateSubmissionPayload,
  ListSubmissionsParams,
  PaginatedResponse,
} from '@/types';

export const statusReportService = {
  listSubmissions(params: ListSubmissionsParams = {}): Promise<PaginatedResponse<SubmissionResponse>> {
    return apiClient.get<PaginatedResponse<SubmissionResponse>>(
      '/status-reports',
      params as Record<string, unknown>,
    );
  },

  getSubmission(id: string): Promise<SubmissionResponse> {
    return apiClient.get<SubmissionResponse>(`/status-reports/${id}`);
  },

  createSubmission(payload: CreateSubmissionPayload, files: File[]): Promise<SubmissionResponse> {
    const formData = new FormData();
    formData.append('companyId', payload.companyId);
    formData.append('referenceMonth', payload.referenceMonth);
    formData.append('deliveryEmail', payload.deliveryEmail);
    if (payload.notes) formData.append('notes', payload.notes);
    for (const file of files) {
      formData.append('attachments', file, file.name);
    }
    return apiClient.postFormData<SubmissionResponse>('/status-reports', formData);
  },

  updateSubmission(id: string, payload: UpdateSubmissionPayload): Promise<SubmissionResponse> {
    return apiClient.put<SubmissionResponse>(`/status-reports/${id}`, payload);
  },

  deleteSubmission(id: string): Promise<void> {
    return apiClient.delete(`/status-reports/${id}`);
  },

  getAttachmentDownloadUrl(submissionId: string, attachmentId: string): string {
    return `/api/status-reports/${submissionId}/attachments/${attachmentId}`;
  },

  getSummary(from: string, to: string, companyId?: string): Promise<SubmissionsSummary> {
    return apiClient.get<SubmissionsSummary>('/status-reports/summary', {
      from,
      to,
      companyId,
    });
  },
};

export interface SubmissionsSummary {
  delivered: number;
  onTime: number;
  late: number;
}
