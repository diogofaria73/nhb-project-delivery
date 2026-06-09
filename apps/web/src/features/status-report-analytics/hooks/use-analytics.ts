import { useEffect, useState } from 'react';
import { statusReportAnalyticsService } from '@/services/status-report-analytics.service';
import type {
  AnalyticsOverview,
  CompanyCompliance,
  ComplianceBand,
  HeatmapResponse,
} from '@/types';

export function useAnalyticsOverview(from: string, to: string, companyId?: string) {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    statusReportAnalyticsService
      .getOverview(from, to, companyId)
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

export function useAnalyticsCompanies(
  from: string,
  to: string,
  band?: ComplianceBand,
  search?: string,
  companyId?: string,
) {
  const [data, setData] = useState<CompanyCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    statusReportAnalyticsService
      .getCompanies(from, to, band, search, companyId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, band, search, companyId]);
  return { data, loading };
}

export function useAnalyticsHeatmap(from: string, to: string, companyId?: string) {
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    statusReportAnalyticsService
      .getHeatmap(from, to, companyId)
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
