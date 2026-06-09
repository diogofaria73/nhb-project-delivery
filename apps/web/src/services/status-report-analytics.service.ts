import { apiClient } from './api-client';
import type {
  AnalyticsOverview,
  CompanyCompliance,
  ComplianceBand,
  HeatmapResponse,
} from '@/types';

export const statusReportAnalyticsService = {
  getOverview(from: string, to: string, companyId?: string): Promise<AnalyticsOverview> {
    return apiClient.get<AnalyticsOverview>('/status-reports/analytics/overview', {
      from,
      to,
      companyId,
    });
  },

  getCompanies(
    from: string,
    to: string,
    band?: ComplianceBand,
    search?: string,
    companyId?: string,
  ): Promise<CompanyCompliance[]> {
    return apiClient.get<CompanyCompliance[]>('/status-reports/analytics/companies', {
      from,
      to,
      band,
      search,
      companyId,
    });
  },

  getHeatmap(from: string, to: string, companyId?: string): Promise<HeatmapResponse> {
    return apiClient.get<HeatmapResponse>('/status-reports/analytics/heatmap', {
      from,
      to,
      companyId,
    });
  },

  exportCsv(
    from: string,
    to: string,
    kind: 'flat' | 'summary',
    companyId?: string,
  ): Promise<Blob> {
    return apiClient.getBlob('/status-reports/analytics/export', {
      from,
      to,
      kind,
      companyId,
    });
  },
};
