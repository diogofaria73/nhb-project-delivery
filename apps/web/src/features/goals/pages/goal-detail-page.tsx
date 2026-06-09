import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Download,
  Pencil,
  Archive,
  Trash2,
  Target,
  Package,
  CalendarClock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGoalDetail } from '../hooks/use-goal-detail';
import { useGoalActions } from '../hooks/use-goal-actions';
import { goalService } from '@/services/goal.service';
import { GoalBreakdownTable } from '../components/goal-breakdown-table';
import { GoalFormDialog } from '../components/goal-form-dialog';
import { GoalArchiveDialog } from '../components/goal-archive-dialog';
import { GoalDeleteDialog } from '../components/goal-delete-dialog';
import { CircularProgress } from '../components/circular-progress';
import type { GoalCreatePayload, GoalUpdatePayload } from '@/types';

function bandTone(rate: number): 'good' | 'warn' | 'bad' {
  if (rate >= 0.9) return 'good';
  if (rate >= 0.5) return 'warn';
  return 'bad';
}

export function GoalDetailPage() {
  const { t } = useTranslation();
  const { isAdmin } = useCurrentUser();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState(false);
  const { goal, breakdown, loading, refetch } = useGoalDetail(id, project);
  const actions = useGoalActions({ onSuccess: refetch });

  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (loading || !goal || !breakdown) {
    return (
      <div className="space-y-4">
        <Link
          to="/goals"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('goals.detail.back')}
        </Link>
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  const tone = bandTone(breakdown.summary.aggregateHitRate);

  async function handleExport() {
    try {
      const blob = await goalService.exportBreakdown(goal!.id, project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goal-breakdown-${goal!.id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('goals.detail.exportError'));
    }
  }

  async function handleFormSubmit(payload: GoalCreatePayload | GoalUpdatePayload) {
    const ok = await actions.updateGoal(goal!.id, payload as GoalUpdatePayload);
    if (ok) setEditOpen(false);
  }

  return (
    <div className="space-y-8">
      <Link
        to="/goals"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('goals.detail.back')}
      </Link>

      {/* Hero — borderless, no card */}
      <div className="flex flex-wrap items-center gap-8 border-b border-border/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {goal.periodLabel}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Package className="h-3 w-3" />
                {t('goals.detail.deliveriesPerCompany', { count: goal.deliveriesPerPeriod })}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {t('goals.detail.deadlineDay', { day: goal.monthlyDeadlineDay })}
              </span>
              <span>· {goal.startDate} → {goal.endDate}</span>
            </p>
          </div>
        </div>

        <div className="flex-1" />

        <CircularProgress
          value={breakdown.summary.aggregateHitRate}
          size={84}
          stroke={7}
          label={t('goals.detail.companiesHit')}
          tone={tone}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            {t('goals.detail.exportCsv')}
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
                {t('common.edit')}
              </Button>
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setArchiveOpen(true)}>
                <Archive className="h-3.5 w-3.5" />
                {goal.isArchived ? t('goals.actions.unarchive') : t('goals.actions.archive')}
              </Button>
              {goal.status === 'upcoming' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('common.delete')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats row — divided columns, no cards */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/60 border-b border-border/60">
        <Stat
          label={t('goals.detail.stats.eligible')}
          value={String(breakdown.summary.eligibleCompanies)}
        />
        <Stat
          label={t('goals.detail.stats.companiesHit')}
          value={`${breakdown.summary.companiesHit} / ${breakdown.summary.eligibleCompanies}`}
        />
        <Stat
          label={t('goals.detail.stats.totalDelivered')}
          value={`${breakdown.summary.totalDelivered}`}
        />
        <Stat
          label={t('goals.detail.stats.totalOnTime')}
          value={`${breakdown.summary.totalOnTime}`}
        />
      </dl>

      {goal.notes && (
        <div className="border-y border-border/60 py-4 text-sm text-foreground">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('goals.form.notes')}
          </p>
          <p className="mt-1 whitespace-pre-wrap">{goal.notes}</p>
        </div>
      )}

      {goal.status === 'active' && (
        <div className="flex items-center justify-between border-y border-border/60 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">{t('goals.detail.projection.title')}</p>
            <p className="text-xs text-muted-foreground">{t('goals.detail.projection.hint')}</p>
          </div>
          <Button
            variant={project ? 'secondary' : 'outline'}
            size="sm"
            className="h-9"
            onClick={() => setProject((v) => !v)}
          >
            {project ? t('goals.detail.projection.on') : t('goals.detail.projection.off')}
          </Button>
        </div>
      )}

      {goal.status === 'concluded' && (
        <div className="border-l-2 border-emerald-500/40 pl-3 text-sm text-foreground">
          <p className="font-medium">{t('goals.detail.finalResult.title')}</p>
          <p className="mt-0.5 text-muted-foreground">{t('goals.detail.finalResult.hint')}</p>
        </div>
      )}

      <GoalBreakdownTable
        rows={breakdown.rows}
        expected={goal.deliveriesPerPeriod}
        showProjection={project}
      />

      <GoalFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        goal={goal}
        loading={actions.loading}
        onSubmit={handleFormSubmit}
      />
      <GoalArchiveDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        goal={goal}
        loading={actions.loading}
        onConfirm={async () => {
          await actions.toggleArchive(goal.id, goal.isArchived);
          setArchiveOpen(false);
        }}
      />
      <GoalDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        goal={goal}
        loading={actions.loading}
        onConfirm={async () => {
          const ok = await actions.deleteGoal(goal.id);
          if (ok) navigate('/goals', { replace: true });
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn('px-5 py-4')}>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
