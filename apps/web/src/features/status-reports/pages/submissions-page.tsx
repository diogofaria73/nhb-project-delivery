import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useSubmissions } from '../hooks/use-submissions';
import { useSubmissionActions } from '../hooks/use-submission-actions';
import { useActiveCompanies } from '../hooks/use-active-companies';
import { SubmissionFilters } from '../components/submission-filters';
import { SubmissionTable } from '../components/submission-table';
import { SubmissionPagination } from '../components/submission-pagination';
import { SubmissionFormDialog } from '../components/submission-form-dialog';
import { SubmissionDetailsDialog } from '../components/submission-details-dialog';
import { SubmissionEditDialog } from '../components/submission-edit-dialog';
import { SubmissionDeleteDialog } from '../components/submission-delete-dialog';
import { useAnalyticsCompanies } from '@/features/status-report-analytics/hooks/use-analytics';
import { ScopeFilter } from '@/features/status-report-analytics/components/scope-filter';
import { PeriodPicker } from '@/features/status-report-analytics/components/period-picker';
import { defaultPeriod } from '@/features/status-report-analytics/hooks/use-default-period';
import type { SubmissionResponse } from '@/types';

export function SubmissionsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useCurrentUser();
  const { companies } = useActiveCompanies();

  const [{ from, to }, setRange] = useState(() => {
    const qFrom = searchParams.get('from');
    const qTo = searchParams.get('to');
    if (qFrom && qTo) return { from: qFrom, to: qTo };
    return defaultPeriod();
  });
  const [companyId, setCompanyId] = useState<string | undefined>(
    () => searchParams.get('companyId') ?? undefined,
  );

  const {
    submissions,
    loading,
    filters,
    setFilters,
    page,
    setPage,
    totalPages,
    total,
    refetch,
  } = useSubmissions({ companyId, from, to });

  const { data: companiesData } = useAnalyticsCompanies(
    from,
    to,
    undefined,
    undefined,
    companyId,
  );

  const actions = useSubmissionActions({ onSuccess: refetch });

  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<SubmissionResponse | null>(null);

  const focusedCompany = useMemo(() => {
    if (!companyId || total > 0) return undefined;
    const c = companiesData.find((row) => row.companyId === companyId);
    if (!c) return undefined;
    return {
      tradeName: c.tradeName,
      expected: c.expected,
      delivered: c.onTime + c.late,
      missed: c.missed,
      late: c.late,
    };
  }, [companyId, total, companiesData]);

  function handleView(s: SubmissionResponse) {
    setSelected(s);
    setDetailsOpen(true);
  }
  function handleEdit(s: SubmissionResponse) {
    setSelected(s);
    setDetailsOpen(false);
    setEditOpen(true);
  }
  function handleDelete(s: SubmissionResponse) {
    setSelected(s);
    setDetailsOpen(false);
    setDeleteOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header with back link */}
      <div>
        <Link
          to="/status-reports"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('statusReports.submissionsPage.breadcrumb')}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {t('statusReports.submissionsPage.title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('statusReports.submissionsPage.description')}
            </p>
          </div>
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

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <ScopeFilter companyId={companyId} onChange={setCompanyId} />
        <PeriodPicker from={from} to={to} onChange={setRange} />
      </div>

      {/* List section */}
      <div>
        {total > 0 && (
          <div className="mb-3 flex items-baseline justify-end">
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {t('statusReports.listSection.count', { count: total })}
            </span>
          </div>
        )}

        <SubmissionFilters
          search={filters.search}
          onSearchChange={(v) => setFilters((p) => ({ ...p, search: v }))}
          companyId={undefined}
          onCompanyChange={() => {}}
          status={filters.status}
          onStatusChange={(v) => setFilters((p) => ({ ...p, status: v }))}
          companies={[]}
          hideCompanyFilter
          hideCreate
        />

        <div className="mt-4">
          <SubmissionTable
            submissions={submissions}
            loading={loading}
            isAdmin={isAdmin}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            focusedCompany={focusedCompany}
            onCreateSubmission={() => setCreateOpen(true)}
            onClearFocus={() => setCompanyId(undefined)}
          />
        </div>

        <div className="mt-4">
          <SubmissionPagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </div>

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

      <SubmissionDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        submission={selected}
        isAdmin={isAdmin}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <SubmissionEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        submission={selected}
        loading={actions.loading}
        onSubmit={async (id, payload) => {
          const success = await actions.updateSubmission(id, payload);
          if (success) setEditOpen(false);
        }}
      />

      <SubmissionDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        submission={selected}
        loading={actions.loading}
        onConfirm={async () => {
          if (!selected) return;
          const success = await actions.deleteSubmission(selected.id);
          if (success) setDeleteOpen(false);
        }}
      />
    </div>
  );
}
