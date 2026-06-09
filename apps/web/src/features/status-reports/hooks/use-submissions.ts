import { useState, useEffect, useCallback } from 'react';
import { statusReportService } from '@/services/status-report.service';
import { useDebounce } from '@/hooks/use-debounce';
import type { SubmissionResponse, SubmissionStatus, PaginatedResponse } from '@/types';

interface Filters {
  search: string;
  companyId?: string;
  status?: SubmissionStatus;
  from?: string;
  to?: string;
}

interface UseSubmissionsScope {
  companyId?: string;
  from?: string;
  to?: string;
}

export function useSubmissions(scope: UseSubmissionsScope = {}) {
  const [data, setData] = useState<PaginatedResponse<SubmissionResponse>>({
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

  const effectiveCompanyId = scope.companyId ?? filters.companyId;
  const effectiveFrom = scope.from ?? filters.from;
  const effectiveTo = scope.to ?? filters.to;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await statusReportService.listSubmissions({
        page,
        limit: 20,
        companyId: effectiveCompanyId,
        status: filters.status,
        from: effectiveFrom,
        to: effectiveTo,
        search: debouncedSearch || undefined,
      });
      setData(result);
    } catch {
      // toast handled in actions hook
    } finally {
      setLoading(false);
    }
  }, [page, effectiveCompanyId, filters.status, effectiveFrom, effectiveTo, debouncedSearch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    setPage(1);
  }, [effectiveCompanyId, filters.status, effectiveFrom, effectiveTo, debouncedSearch]);

  return {
    submissions: data.data,
    loading,
    filters,
    setFilters,
    page,
    setPage,
    totalPages: data.totalPages,
    total: data.total,
    refetch: fetch,
  };
}
