import { useCallback, useEffect, useState } from 'react';
import type { DashboardResponseDto } from '@nhb-status-report/shared';
import { projectTrackingService } from '@/services/project-tracking.service';

export interface UseDashboardResult {
  data: DashboardResponseDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard(year?: number): UseDashboardResult {
  const [data, setData] = useState<DashboardResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await projectTrackingService.getDashboard(year);
      setData(result);
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? 'Failed to load dashboard';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
