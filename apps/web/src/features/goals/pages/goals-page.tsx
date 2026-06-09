import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Target, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGoals } from '../hooks/use-goals';
import { useGoalActions } from '../hooks/use-goal-actions';
import { GoalRow } from '../components/goal-row';
import { GoalFormDialog } from '../components/goal-form-dialog';
import { GoalArchiveDialog } from '../components/goal-archive-dialog';
import { GoalDeleteDialog } from '../components/goal-delete-dialog';
import type {
  GoalCreatePayload,
  GoalListStatusFilter,
  GoalResponse,
  GoalUpdatePayload,
} from '@/types';

export function GoalsPage() {
  const { t } = useTranslation();
  const { isAdmin } = useCurrentUser();
  const [filter, setFilter] = useState<GoalListStatusFilter>('all');
  const { goals, loading, refetch } = useGoals(filter);
  const actions = useGoalActions({ onSuccess: refetch });

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<GoalResponse | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const sections = useMemo(() => {
    const active = goals.filter((g) => g.status === 'active' && !g.isArchived);
    const upcoming = goals.filter((g) => g.status === 'upcoming' && !g.isArchived);
    const concluded = goals.filter((g) => g.status === 'concluded' && !g.isArchived);
    const archived = goals.filter((g) => g.isArchived);
    return { active, upcoming, concluded, archived };
  }, [goals]);

  const totals = useMemo(() => {
    const active = sections.active;
    const aggregateHit = active.length
      ? active.reduce((a, g) => a + (g.summary?.aggregateHitRate ?? 0), 0) / active.length
      : 0;
    const eligibleSum = active.reduce((a, g) => a + (g.summary?.eligibleCompanies ?? 0), 0);
    const hitSum = active.reduce((a, g) => a + (g.summary?.companiesHit ?? 0), 0);
    return {
      activeGoals: active.length,
      avgHit: Math.round(aggregateHit * 100),
      eligibleSum,
      hitSum,
    };
  }, [sections.active]);

  function handleCreate() {
    setFormMode('create');
    setSelected(null);
    setFormOpen(true);
  }
  function handleEdit(g: GoalResponse) {
    setFormMode('edit');
    setSelected(g);
    setFormOpen(true);
  }
  function handleArchive(g: GoalResponse) {
    setSelected(g);
    setArchiveOpen(true);
  }
  function handleDelete(g: GoalResponse) {
    setSelected(g);
    setDeleteOpen(true);
  }

  async function handleFormSubmit(payload: GoalCreatePayload | GoalUpdatePayload) {
    const ok =
      formMode === 'create'
        ? await actions.createGoal(payload as GoalCreatePayload)
        : await actions.updateGoal(selected!.id, payload as GoalUpdatePayload);
    if (ok) setFormOpen(false);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t('goals.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('goals.description')}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={filter === 'archived' ? 'secondary' : 'outline'}
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setFilter(filter === 'archived' ? 'all' : 'archived')}
          >
            <ArchiveRestore className="h-3.5 w-3.5" />
            {filter === 'archived' ? t('goals.showActive') : t('goals.showArchived')}
          </Button>
          {isAdmin && (
            <Button onClick={handleCreate} size="sm" className="h-9 gap-1.5 px-4 font-semibold">
              <Plus className="h-4 w-4" />
              {t('goals.newGoal')}
            </Button>
          )}
        </div>
      </div>

      {/* Hero summary (no cards — borderless stats row) */}
      {!loading && filter !== 'archived' && totals.activeGoals > 0 && (
        <div className="border-y border-border/60">
          <dl className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/60">
            <Stat
              label={t('goals.hero.activeGoals')}
              value={String(totals.activeGoals)}
            />
            <Stat
              label={t('goals.hero.companiesHit')}
              value={`${totals.hitSum} / ${totals.eligibleSum}`}
            />
            <Stat
              label={t('goals.hero.avgHit')}
              value={`${totals.avgHit}%`}
              accent={totals.avgHit >= 90 ? 'good' : totals.avgHit >= 50 ? 'warn' : 'bad'}
            />
            <Stat
              label={t('goals.hero.windowsTracked')}
              value={`${sections.active.length + sections.upcoming.length + sections.concluded.length}`}
            />
          </dl>
        </div>
      )}

      {/* Sections */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">{t('common.loading')}</p>
      ) : filter === 'archived' ? (
        <Section title={t('goals.sections.archived')} goals={sections.archived} isAdmin={isAdmin}
          onEdit={handleEdit} onArchive={handleArchive} onDelete={handleDelete} />
      ) : (
        <>
          <Section title={t('goals.sections.active')} goals={sections.active} isAdmin={isAdmin}
            onEdit={handleEdit} onArchive={handleArchive} onDelete={handleDelete} />
          <Section title={t('goals.sections.upcoming')} goals={sections.upcoming} isAdmin={isAdmin}
            onEdit={handleEdit} onArchive={handleArchive} onDelete={handleDelete} />
          <Section title={t('goals.sections.concluded')} goals={sections.concluded} isAdmin={isAdmin}
            onEdit={handleEdit} onArchive={handleArchive} onDelete={handleDelete} />
          {goals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Target className="mb-3 h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">{t('goals.empty.title')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('goals.empty.hint')}</p>
              {isAdmin && (
                <Button size="sm" className="mt-5 h-9 gap-1.5 px-4 font-semibold" onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  {t('goals.newGoal')}
                </Button>
              )}
            </div>
          )}
        </>
      )}

      <GoalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        goal={selected}
        loading={actions.loading}
        onSubmit={handleFormSubmit}
      />
      <GoalArchiveDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        goal={selected}
        loading={actions.loading}
        onConfirm={async () => {
          if (!selected) return;
          const ok = await actions.toggleArchive(selected.id, selected.isArchived);
          if (ok) setArchiveOpen(false);
        }}
      />
      <GoalDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        goal={selected}
        loading={actions.loading}
        onConfirm={async () => {
          if (!selected) return;
          const ok = await actions.deleteGoal(selected.id);
          if (ok) setDeleteOpen(false);
        }}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'good' | 'warn' | 'bad';
}) {
  const tone =
    accent === 'good'
      ? 'text-emerald-700 dark:text-emerald-400'
      : accent === 'warn'
        ? 'text-amber-700 dark:text-amber-400'
        : accent === 'bad'
          ? 'text-destructive'
          : 'text-foreground';
  return (
    <div className="px-5 py-4">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-xl font-semibold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}

function Section({
  title,
  goals,
  isAdmin,
  onEdit,
  onArchive,
  onDelete,
}: {
  title: string;
  goals: GoalResponse[];
  isAdmin: boolean;
  onEdit: (g: GoalResponse) => void;
  onArchive: (g: GoalResponse) => void;
  onDelete: (g: GoalResponse) => void;
}) {
  if (goals.length === 0) return null;
  return (
    <div>
      <p className="mb-2 px-5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
        <span className="ml-2 font-medium tabular-nums text-muted-foreground/70">{goals.length}</span>
      </p>
      <div className="border-y border-border/60 divide-y divide-border/60">
        {goals.map((g) => (
          <GoalRow
            key={g.id}
            goal={g}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
