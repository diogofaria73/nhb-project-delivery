import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, Clock, Package, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { AnalyticsOverview } from '@/types';
import type { SubmissionsSummary } from '@/services/status-report.service';

interface Props {
  overview: AnalyticsOverview | null;
  summary: SubmissionsSummary | null;
  loading: boolean;
  mode: 'full' | 'basic';
}

type Tone = 'good' | 'warn' | 'bad' | 'neutral';

function adherenceTone(rate: number): Tone {
  if (rate >= 0.9) return 'good';
  if (rate >= 0.6) return 'warn';
  return 'bad';
}

const toneText: Record<Tone, string> = {
  good: 'text-emerald-700 dark:text-emerald-400',
  warn: 'text-amber-700 dark:text-amber-400',
  bad: 'text-destructive',
  neutral: 'text-foreground',
};

const toneIconBg: Record<Tone, string> = {
  good: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  warn: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  bad: 'bg-destructive/10 text-destructive ring-destructive/20',
  neutral: 'bg-foreground/5 text-muted-foreground ring-border',
};

export function ExecutiveKpiCards({ overview, summary, loading, mode }: Props) {
  const { t } = useTranslation();

  if (mode === 'full') {
    const k = overview?.kpis;
    const expected = k?.expected ?? 0;
    const onTime = k?.onTime ?? 0;
    const late = k?.late ?? 0;
    const delivered = onTime + late;
    const adherence = expected > 0 ? onTime / expected : 0;
    const adherenceT = adherenceTone(adherence);

    // Delta for adherence: in percentage points vs previous period
    const prevOnTime = onTime - (k?.deltas?.onTime ?? 0);
    const prevExpected = expected - (k?.deltas?.expected ?? 0);
    const prevAdherence = prevExpected > 0 ? prevOnTime / prevExpected : 0;
    const adherenceDelta = k?.deltas ? (adherence - prevAdherence) * 100 : undefined;

    const deliveredDelta = k?.deltas ? (k.deltas.onTime + k.deltas.late) : undefined;
    const onTimeDelta = k?.deltas?.onTime;
    const lateDelta = k?.deltas?.late;

    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card
          icon={Target}
          label={t('statusReports.dashboard.cards.adherence')}
          value={
            expected > 0
              ? `${Math.round(adherence * 100)}%`
              : '—'
          }
          hint={
            expected > 0
              ? t('statusReports.dashboard.cards.adherenceHint', { onTime, expected })
              : t('statusReports.dashboard.cards.empty')
          }
          tone={expected > 0 ? adherenceT : 'neutral'}
          delta={adherenceDelta}
          deltaSuffix={t('statusReports.dashboard.cards.delta.pp')}
          deltaPositiveIsGood
          loading={loading}
        />
        <Card
          icon={Package}
          label={t('statusReports.dashboard.cards.delivered')}
          value={`${delivered}${expected > 0 ? ` / ${expected}` : ''}`}
          hint={
            expected > 0
              ? t('statusReports.dashboard.cards.deliveredHint', {
                  count: Math.max(expected - delivered, 0),
                })
              : t('statusReports.dashboard.cards.deliveredAny', { count: delivered })
          }
          tone="neutral"
          delta={deliveredDelta}
          deltaPositiveIsGood
          loading={loading}
        />
        <Card
          icon={CheckCircle2}
          label={t('statusReports.dashboard.cards.onTime')}
          value={onTime.toString()}
          hint={t('statusReports.dashboard.cards.onTimeHint')}
          tone="good"
          delta={onTimeDelta}
          deltaPositiveIsGood
          loading={loading}
        />
        <Card
          icon={Clock}
          label={t('statusReports.dashboard.cards.late')}
          value={late.toString()}
          hint={t('statusReports.dashboard.cards.lateHint')}
          tone={late > 0 ? 'warn' : 'neutral'}
          delta={lateDelta}
          deltaPositiveIsGood={false}
          loading={loading}
        />
      </div>
    );
  }

  // basic mode (no expected, no deltas)
  const onTime = summary?.onTime ?? 0;
  const late = summary?.late ?? 0;
  const delivered = summary?.delivered ?? 0;
  const adherence = delivered > 0 ? onTime / delivered : 0;
  const adherenceT = delivered > 0 ? adherenceTone(adherence) : 'neutral';

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card
        icon={Target}
        label={t('statusReports.dashboard.cards.adherence')}
        value={delivered > 0 ? `${Math.round(adherence * 100)}%` : '—'}
        hint={
          delivered > 0
            ? t('statusReports.dashboard.cards.adherenceHintBasic', { onTime, delivered })
            : t('statusReports.dashboard.cards.empty')
        }
        tone={adherenceT}
        loading={loading}
      />
      <Card
        icon={Package}
        label={t('statusReports.dashboard.cards.delivered')}
        value={delivered.toString()}
        hint={t('statusReports.dashboard.cards.deliveredAny', { count: delivered })}
        tone="neutral"
        loading={loading}
      />
      <Card
        icon={CheckCircle2}
        label={t('statusReports.dashboard.cards.onTime')}
        value={onTime.toString()}
        hint={t('statusReports.dashboard.cards.onTimeHint')}
        tone="good"
        loading={loading}
      />
      <Card
        icon={Clock}
        label={t('statusReports.dashboard.cards.late')}
        value={late.toString()}
        hint={t('statusReports.dashboard.cards.lateHint')}
        tone={late > 0 ? 'warn' : 'neutral'}
        loading={loading}
      />
    </div>
  );
}

function Card({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  delta,
  deltaSuffix,
  deltaPositiveIsGood = true,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  tone: Tone;
  delta?: number;
  deltaSuffix?: string;
  deltaPositiveIsGood?: boolean;
  loading: boolean;
}) {
  return (
    <div className="relative rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md ring-1',
            toneIconBg[tone],
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        {loading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <p
            className={cn(
              'text-3xl font-semibold tabular-nums leading-none',
              toneText[tone],
            )}
          >
            {value}
          </p>
        )}
        {!loading && delta !== undefined && (
          <DeltaPill delta={delta} suffix={deltaSuffix} positiveIsGood={deltaPositiveIsGood} />
        )}
      </div>

      {hint && (
        <p className="mt-2 text-xs text-muted-foreground">
          {loading ? <Skeleton className="h-3 w-32" /> : hint}
        </p>
      )}
    </div>
  );
}

function DeltaPill({
  delta,
  suffix,
  positiveIsGood,
}: {
  delta: number;
  suffix?: string;
  positiveIsGood: boolean;
}) {
  const isFlat = Math.abs(delta) < 0.5;
  const isUp = delta > 0;
  const good = isFlat ? false : (isUp ? positiveIsGood : !positiveIsGood);
  const Icon = isFlat ? ArrowRight : isUp ? ArrowUp : ArrowDown;
  const display = Math.abs(delta);
  const text =
    suffix === undefined
      ? Math.round(display).toString()
      : `${display.toFixed(1)}${suffix}`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
        isFlat
          ? 'bg-muted text-muted-foreground'
          : good
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : 'bg-destructive/10 text-destructive',
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.2} />
      {text}
    </span>
  );
}
