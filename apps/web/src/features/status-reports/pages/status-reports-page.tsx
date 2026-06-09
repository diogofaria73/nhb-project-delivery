import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useSubmissionActions } from '../hooks/use-submission-actions';
import { useActiveCompanies } from '../hooks/use-active-companies';
import { useSubmissionsSummary } from '../hooks/use-submissions-summary';
import { ExecutiveKpiCards } from '../components/executive-kpi-cards';
import { MetaVsDeliveredChart } from '../components/meta-vs-delivered-chart';
import { ActionNeededPanel } from '../components/action-needed-panel';
import { SubmissionFormDialog } from '../components/submission-form-dialog';
import {
  useAnalyticsOverview,
  useAnalyticsCompanies,
  useAnalyticsHeatmap,
} from '@/features/status-report-analytics/hooks/use-analytics';
import { ComplianceHeatmap } from '@/features/status-report-analytics/components/compliance-heatmap';
import { CompanyComplianceTable } from '@/features/status-report-analytics/components/company-table';
import { ScopeFilter } from '@/features/status-report-analytics/components/scope-filter';
import { PeriodPicker } from '@/features/status-report-analytics/components/period-picker';
import { defaultPeriod } from '@/features/status-report-analytics/hooks/use-default-period';
import { GoalStatusStrip } from '@/features/goals';

export function StatusReportsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const { companies } = useActiveCompanies();

  const [{ from, to }, setRange] = useState(defaultPeriod);
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);

  const submissionsHref = useMemo(() => {
    const params = new URLSearchParams();
    if (companyId) params.set('companyId', companyId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return qs ? `/status-reports/submissions?${qs}` : '/status-reports/submissions';
  }, [companyId, from, to]);

  function openSubmissionsForCompany(targetCompanyId: string) {
    const params = new URLSearchParams();
    params.set('companyId', targetCompanyId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    navigate(`/status-reports/submissions?${params.toString()}`);
  }

  // Admin-only rich analytics; falls back to /summary for non-admin
  const { data: overview, loading: overviewLoading } = useAnalyticsOverview(
    from,
    to,
    companyId,
  );
  const { data: summary, loading: summaryLoading } = useSubmissionsSummary(
    from,
    to,
    companyId,
  );
  const { data: companiesData, loading: companiesLoading } = useAnalyticsCompanies(
    from,
    to,
    undefined,
    undefined,
    companyId,
  );
  const { data: heatmap, loading: heatmapLoading } = useAnalyticsHeatmap(
    from,
    to,
    companyId,
  );

  const [createOpen, setCreateOpen] = useState(false);
  const actions = useSubmissionActions({
    onSuccess: () => {
      // Refresh by re-setting state (cheap) — hooks depend on from/to/companyId
      setRange((r) => ({ ...r }));
    },
  });

  const cardsMode: 'full' | 'basic' = isAdmin ? 'full' : 'basic';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t('statusReports.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('statusReports.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={submissionsHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
          >
            {t('statusReports.dashboard.links.viewAllSubmissions')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            className="h-9 gap-1.5 px-4 font-semibold"
          >
            <Plus className="h-4 w-4" />
            {t('statusReports.newSubmission')}
          </Button>
        </div>
      </div>

      <GoalStatusStrip />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <ScopeFilter companyId={companyId} onChange={setCompanyId} />
        <PeriodPicker from={from} to={to} onChange={setRange} />
      </div>

      {/* Executive KPI cards */}
      <ExecutiveKpiCards
        overview={overview}
        summary={summary}
        loading={cardsMode === 'full' ? overviewLoading : summaryLoading}
        mode={cardsMode}
      />

      {/* Action-needed banner (Admin) */}
      {isAdmin && (
        <ActionNeededPanel
          from={from}
          to={to}
          companyId={companyId}
          onCompanySelect={setCompanyId}
        />
      )}

      {/* Adherence: Meta vs Delivered per company (Admin) */}
      {isAdmin && (
        <MetaVsDeliveredChart
          data={companiesData}
          loading={companiesLoading}
          onCompanySelect={setCompanyId}
        />
      )}

      {/* Compliance heatmap (Admin) */}
      {isAdmin && (
        <section>
          <ComplianceHeatmap data={heatmap} loading={heatmapLoading} />
        </section>
      )}

      {/* Company details table (Admin) */}
      {isAdmin && (
        <section>
          <CompanyComplianceTable
            data={companiesData}
            loading={companiesLoading}
            onCompanyOpen={openSubmissionsForCompany}
          />
        </section>
      )}

      <SubmissionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companies={companies}
        loading={actions.loading}
        onSubmit={async (payload, files) => {
          const success = await actions.createSubmission(payload, files);
          if (success) setCreateOpen(false);
        }}
      />
    </div>
  );
}
