import { useCallback, useEffect, useState } from 'react';
import type {
  ImportListParams,
  ProjectImportResponseDto,
} from '@nhb-status-report/shared';
import { projectTrackingService } from '@/services/project-tracking.service';

export interface UseImportHistoryResult {
  data: ProjectImportResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useImportHistory(
  params: ImportListParams,
): UseImportHistoryResult {
  const [state, setState] = useState({
    data: [] as ProjectImportResponseDto[],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await projectTrackingService.listImports(params);
      setState(result);
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? 'Failed to load imports';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setLoading(false);
    }
  }, [params.year, params.status, params.page, params.limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, loading, error, refetch: fetchData };
}
