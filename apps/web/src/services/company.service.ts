import { apiClient } from './api-client';
import type {
  CompanyResponse,
  CreateCompanyPayload,
  UpdateCompanyPayload,
  ListCompaniesParams,
  PaginatedResponse,
} from '@/types';

export const companyService = {
  listCompanies(params: ListCompaniesParams = {}): Promise<PaginatedResponse<CompanyResponse>> {
    return apiClient.get<PaginatedResponse<CompanyResponse>>(
      '/companies',
      params as Record<string, unknown>,
    );
  },

  getCompanyById(id: string): Promise<CompanyResponse> {
    return apiClient.get<CompanyResponse>(`/companies/${id}`);
  },

  createCompany(payload: CreateCompanyPayload): Promise<CompanyResponse> {
    return apiClient.post<CompanyResponse>('/companies', payload);
  },

  updateCompany(id: string, payload: UpdateCompanyPayload): Promise<CompanyResponse> {
    return apiClient.put<CompanyResponse>(`/companies/${id}`, payload);
  },

  toggleCompanyStatus(id: string): Promise<CompanyResponse> {
    return apiClient.patch<CompanyResponse>(`/companies/${id}/toggle-status`);
  },
};
