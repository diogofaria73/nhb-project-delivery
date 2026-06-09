import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle2, AlertTriangle, XCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalyticsOverview } from '@/types';

interface Props {
  overview: AnalyticsOverview | null;
  loading: boolean;
  activeGoal?: { deliveriesPerPeriod: number; monthlyDeadlineDay: number };
}

function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  loading,
  tone = 'neutral',
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  delta?: number;
  loading: boolean;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
  hint?: string;
}) {
  const toneClasses: Record<typeof tone, string> = {
    neutral: 'bg-foreground/[0.06] text-foreground',
    good: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    warn: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    bad: 'bg-destructive/15 text-destructive',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', toneClasses[tone])}>
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-semibold tabular-nums text-foreground">
            {loading ? '—' : value.toLocaleString()}
          </p>
        </div>
      </div>
      {!loading && delta !== undefined && delta !== 0 && (
        <p
          className={cn(
            'mt-2 inline-flex items-center gap-1 text-[11px] font-medium tabular-nums',
            delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
          )}
        >
          {delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(delta).toLocaleString()}
        </p>
      )}
      {!loading && hint && (
        <p className="mt-2 text-[11px] font-medium text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function KpiCards({ overview, loading, activeGoal }: Props) {
  const { t } = useTranslation();
  const k = overview?.kpis;
  const targetHint = activeGoal
    ? t('statusReportAnalytics.kpis.targetHint', {
        count: activeGoal.deliveriesPerPeriod,
        day: activeGoal.monthlyDeadlineDay,
      })
    : undefined;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={Clock}
        label={t('statusReportAnalytics.kpis.expected')}
        value={k?.expected ?? 0}
        delta={k?.deltas?.expected}
        loading={loading}
      />
      <KpiCard
        icon={CheckCircle2}
        label={t('statusReportAnalytics.kpis.onTime')}
        value={k?.onTime ?? 0}
        delta={k?.deltas?.onTime}
        loading={loading}
        tone="good"
        hint={targetHint}
      />
      <KpiCard
        icon={AlertTriangle}
        label={t('statusReportAnalytics.kpis.late')}
        value={k?.late ?? 0}
        delta={k?.deltas?.late}
        loading={loading}
        tone="warn"
      />
      <KpiCard
        icon={XCircle}
        label={t('statusReportAnalytics.kpis.missed')}
        value={k?.missed ?? 0}
        delta={k?.deltas?.missed}
        loading={loading}
        tone="bad"
      />
    </div>
  );
}
