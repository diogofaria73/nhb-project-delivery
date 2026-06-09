export interface CompanyResponse {
  id: string;
  tradeName: string;
  legalName: string;
  cnpj: string;
  cnpjFormatted: string;
  contactEmail: string;
  contactPhone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyPayload {
  tradeName: string;
  legalName: string;
  cnpj: string;
  contactEmail: string;
  contactPhone?: string | null;
  notes?: string | null;
}

export interface UpdateCompanyPayload {
  tradeName?: string;
  legalName?: string;
  contactEmail?: string;
  contactPhone?: string | null;
  notes?: string | null;
}

export interface ListCompaniesParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
