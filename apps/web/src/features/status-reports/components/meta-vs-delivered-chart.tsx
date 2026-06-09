import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CompanyCompliance } from '@/types';

interface Props {
  data: CompanyCompliance[];
  loading: boolean;
  onCompanySelect?: (companyId: string) => void;
}

type SortMode = 'worst-first' | 'best-first' | 'name';

const DEFAULT_PAGE_SIZE = 10;

export function MetaVsDeliveredChart({ data, loading, onCompanySelect }: Props) {
  const { t } = useTranslation();
  const [sort, setSort] = useState<SortMode>('worst-first');
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...data];
    if (sort === 'name') {
      copy.sort((a, b) => a.tradeName.localeCompare(b.tradeName));
    } else if (sort === 'best-first') {
      copy.sort((a, b) => b.score - a.score);
    } else {
      copy.sort((a, b) => a.score - b.score);
    }
    return copy;
  }, [data, sort]);

  const visible = showAll ? sorted : sorted.slice(0, DEFAULT_PAGE_SIZE);
  const maxExpected = useMemo(
    () => Math.max(1, ...data.map((c) => c.expected)),
    [data],
  );

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {t('statusReports.dashboard.chart.title')}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('statusReports.dashboard.chart.subtitle')}
          </p>
        </div>
        <SortToggle sort={sort} onChange={setSort} />
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        <Legend tone="onTime" label={t('statusReports.dashboard.chart.legend.onTime')} />
        <Legend tone="late" label={t('statusReports.dashboard.chart.legend.late')} />
        <Legend tone="missed" label={t('statusReports.dashboard.chart.legend.missed')} />
      </div>

      {loading ? (
        <ul className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="grid grid-cols-[minmax(160px,200px)_1fr_120px] items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-4 w-20" />
            </li>
          ))}
        </ul>
      ) : sorted.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t('statusReports.dashboard.chart.empty')}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {visible.map((c) => (
            <CompanyRow
              key={c.companyId}
              row={c}
              maxExpected={maxExpected}
              onSelect={onCompanySelect}
            />
          ))}
        </ul>
      )}

      {sorted.length > DEFAULT_PAGE_SIZE && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((v) => !v)}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            {showAll
              ? t('statusReports.dashboard.chart.showLess')
              : t('statusReports.dashboard.chart.showMore', {
                  count: sorted.length - DEFAULT_PAGE_SIZE,
                })}
          </Button>
        </div>
      )}
    </section>
  );
}

function CompanyRow({
  row,
  maxExpected,
  onSelect,
}: {
  row: CompanyCompliance;
  maxExpected: number;
  onSelect?: (companyId: string) => void;
}) {
  const { tradeName, expected, onTime, late, missed, score } = row;
  const delivered = onTime + late;

  // Scale the bar's full width relative to the largest expected in the dataset.
  // This keeps proportions honest when some companies expect more than others.
  const trackWidthPct = maxExpected > 0 ? (expected / maxExpected) * 100 : 0;
  const onTimePct = expected > 0 ? (onTime / expected) * 100 : 0;
  const latePct = expected > 0 ? (late / expected) * 100 : 0;

  const clickable = Boolean(onSelect);
  const Wrapper: React.ElementType = clickable ? 'button' : 'div';

  return (
    <li>
      <Wrapper
        type={clickable ? 'button' : undefined}
        onClick={clickable ? () => onSelect?.(row.companyId) : undefined}
        className={cn(
          'group grid w-full grid-cols-[minmax(140px,200px)_1fr_minmax(110px,140px)] items-center gap-4 rounded-md px-2 py-2 text-left',
          clickable && 'transition-colors hover:bg-foreground/[0.025]',
        )}
      >
        <p className="truncate text-sm font-medium text-foreground" title={tradeName}>
          {tradeName}
        </p>

        {/* Bar: light track represents `expected` proportionally to the largest expected.
            Inside, on-time fills first (green), then late stacks (amber). The remaining
            empty portion of the track represents missed. */}
        <div className="relative">
          <div
            className="relative h-2.5 overflow-hidden rounded-full bg-foreground/[0.06]"
            style={{ width: `${Math.max(trackWidthPct, 4)}%` }}
          >
            <div
              className="absolute left-0 top-0 h-full bg-emerald-500"
              style={{ width: `${Math.min(onTimePct, 100)}%` }}
            />
            <div
              className="absolute top-0 h-full bg-amber-500"
              style={{
                left: `${Math.min(onTimePct, 100)}%`,
                width: `${Math.min(latePct, Math.max(100 - onTimePct, 0))}%`,
              }}
            />
            {missed > 0 && (
              <div
                className="absolute top-0 h-full bg-destructive/40"
                style={{
                  left: `${Math.min(onTimePct + latePct, 100)}%`,
                  width: `${Math.max(100 - onTimePct - latePct, 0)}%`,
                }}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <span className="text-xs tabular-nums text-muted-foreground">
            {delivered}/{expected}
          </span>
          <ScorePill score={score} />
          {clickable && (
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
          )}
        </div>
      </Wrapper>
    </li>
  );
}

function ScorePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const tone =
    score >= 0.9
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
      : score >= 0.6
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
        : 'bg-destructive/15 text-destructive';
  return (
    <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums', tone)}>
      {pct}%
    </span>
  );
}

function Legend({
  tone,
  label,
}: {
  tone: 'onTime' | 'late' | 'missed';
  label: string;
}) {
  const cls =
    tone === 'onTime'
      ? 'bg-emerald-500'
      : tone === 'late'
        ? 'bg-amber-500'
        : 'bg-destructive/40';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-sm', cls)} />
      {label}
    </span>
  );
}

function SortToggle({
  sort,
  onChange,
}: {
  sort: SortMode;
  onChange: (s: SortMode) => void;
}) {
  const { t } = useTranslation();
  const next = (s: SortMode): SortMode =>
    s === 'worst-first' ? 'best-first' : s === 'best-first' ? 'name' : 'worst-first';
  const label =
    sort === 'worst-first'
      ? t('statusReports.dashboard.chart.sort.worst')
      : sort === 'best-first'
        ? t('statusReports.dashboard.chart.sort.best')
        : t('statusReports.dashboard.chart.sort.name');
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onChange(next(sort))}
      className="h-7 gap-1.5 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowUpDown className="h-3 w-3" />
      {label}
    </Button>
  );
}
