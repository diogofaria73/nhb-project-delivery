import { useState, useEffect, useCallback } from 'react';
import { companyService } from '@/services/company.service';
import { useDebounce } from '@/hooks/use-debounce';
import type { CompanyResponse, PaginatedResponse } from '@/types';

interface Filters {
  isActive?: boolean;
  search: string;
}

interface UseCompaniesReturn {
  companies: CompanyResponse[];
  loading: boolean;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  total: number;
  refetch: () => void;
}

export function useCompanies(): UseCompaniesReturn {
  const [data, setData] = useState<PaginatedResponse<CompanyResponse>>({
    data: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ search: '' });

  const debouncedSearch = useDebounce(filters.search);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const result = await companyService.listCompanies({
        page,
        limit: 20,
        isActive: filters.isActive,
        search: debouncedSearch || undefined,
      });
      setData(result);
    } catch {
      // toast handled in action hook
    } finally {
      setLoading(false);
    }
  }, [page, filters.isActive, debouncedSearch]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    setPage(1);
  }, [filters.isActive, debouncedSearch]);

  return {
    companies: data.data,
    loading,
    filters,
    setFilters,
    page,
    setPage,
    totalPages: data.totalPages,
    total: data.total,
    refetch: fetchCompanies,
  };
}
