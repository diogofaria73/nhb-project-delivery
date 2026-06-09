import { useEffect, useState } from 'react';
import { statusReportService, type SubmissionsSummary } from '@/services/status-report.service';

export function useSubmissionsSummary(from: string, to: string, companyId?: string) {
  const [data, setData] = useState<SubmissionsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    statusReportService
      .getSummary(from, to, companyId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, companyId]);

  return { data, loading };
}
