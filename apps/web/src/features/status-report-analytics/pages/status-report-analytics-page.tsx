import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { statusReportAnalyticsService } from '@/services/status-report-analytics.service';
import { goalService } from '@/services/goal.service';
import { GoalStatusStrip } from '@/features/goals';
import { PeriodPicker } from '../components/period-picker';
import { ScopeFilter } from '../components/scope-filter';
import { GlobalAdherenceChart } from '../components/global-adherence-chart';
import { CompanyAdherenceBars } from '../components/company-adherence-bars';
import { MonthlyChart } from '../components/monthly-chart';
import { CompanyComplianceTable } from '../components/company-table';
import { ComplianceHeatmap } from '../components/compliance-heatmap';
import { defaultPeriod } from '../hooks/use-default-period';
import {
  useAnalyticsCompanies,
  useAnalyticsHeatmap,
  useAnalyticsOverview,
} from '../hooks/use-analytics';

export function StatusReportAnalyticsPage() {
  const { t } = useTranslation();
  const [{ from, to }, setRange] = useState(defaultPeriod);
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);

  const { data: overview, loading: overviewLoading } = useAnalyticsOverview(from, to, companyId);
  const { data: companies, loading: companiesLoading } = useAnalyticsCompanies(
    from,
    to,
    undefined,
    undefined,
    companyId,
  );
  const { data: heatmap, loading: heatmapLoading } = useAnalyticsHeatmap(from, to, companyId);

  const [activeGoal, setActiveGoal] = useState<
    { deliveriesPerPeriod: number; monthlyDeadlineDay: number } | undefined
  >(undefined);
  useEffect(() => {
    let cancelled = false;
    goalService
      .listGoals({ status: 'active' })
      .then((goals) => {
        if (cancelled) return;
        const first = goals[0];
        setActiveGoal(
          first
            ? {
                deliveriesPerPeriod: first.deliveriesPerPeriod,
                monthlyDeadlineDay: first.monthlyDeadlineDay,
              }
            : undefined,
        );
      })
      .catch(() => {
        if (!cancelled) setActiveGoal(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isGlobal = !companyId;
  const selectedCompanyLabel = useMemo(() => {
    if (isGlobal) return t('statusReportAnalytics.scope.global');
    return companies.find((c) => c.companyId === companyId)?.tradeName ?? '—';
  }, [isGlobal, companies, companyId, t]);

  async function handleExport(kind: 'flat' | 'summary') {
    try {
      const blob = await statusReportAnalyticsService.exportCsv(from, to, kind, companyId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `status-report-analytics-${from}-${to}-${kind}${companyId ? `-${companyId}` : ''}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('statusReportAnalytics.export.error'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t('statusReportAnalytics.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('statusReportAnalytics.description')}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-9 gap-1.5 font-semibold">
              <Download className="h-3.5 w-3.5" />
              {t('statusReportAnalytics.export.button')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem onClick={() => handleExport('flat')} className="text-sm">
              {t('statusReportAnalytics.export.flat')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('summary')} className="text-sm">
              {t('statusReportAnalytics.export.summary')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <GoalStatusStrip />

      <div className="flex flex-wrap items-end gap-4">
        <ScopeFilter companyId={companyId} onChange={setCompanyId} />
        <PeriodPicker from={from} to={to} onChange={setRange} />
        {activeGoal && (
          <p className="ml-auto text-xs text-muted-foreground">
            {t('statusReportAnalytics.kpis.targetHint', {
              count: activeGoal.deliveriesPerPeriod,
              day: activeGoal.monthlyDeadlineDay,
            })}
          </p>
        )}
      </div>

      {/* Donut + KPIs — the new intuitive global view */}
      <GlobalAdherenceChart
        overview={overview}
        loading={overviewLoading}
        scopeLabel={selectedCompanyLabel}
        isGlobal={isGlobal}
      />

      {/* Monthly trend (existing, still useful) */}
      <MonthlyChart overview={overview} loading={overviewLoading} />

      {/* New: horizontal bar chart per company — only in global view (redundant for a single company) */}
      {isGlobal && (
        <CompanyAdherenceBars data={companies} loading={companiesLoading} />
      )}

      {/* Detail table (kept for explorers); when a single company is selected the table will only have that row */}
      <CompanyComplianceTable data={companies} loading={companiesLoading} />

      {/* Heatmap kept for patterns; filtered to single company collapses to one row */}
      <ComplianceHeatmap data={heatmap} loading={heatmapLoading} />
    </div>
  );
}
