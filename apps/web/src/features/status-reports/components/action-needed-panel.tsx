import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalyticsCompanies } from '@/features/status-report-analytics/hooks/use-analytics';
import type { ComplianceBand } from '@/types';

interface Props {
  from: string;
  to: string;
  companyId?: string;
  onCompanySelect?: (companyId: string) => void;
}

const dotClass: Record<ComplianceBand, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-destructive',
};

const scorePillClass: Record<ComplianceBand, string> = {
  green: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  red: 'bg-destructive/15 text-destructive',
};

const MAX_VISIBLE = 5;

export function ActionNeededPanel({ from, to, companyId, onCompanySelect }: Props) {
  const { t } = useTranslation();
  const { data, loading } = useAnalyticsCompanies(from, to, undefined, undefined, companyId);

  const atRisk = useMemo(() => data.filter((c) => c.band !== 'green'), [data]);

  if (loading || atRisk.length === 0) return null;

  const visible = atRisk.slice(0, MAX_VISIBLE);
  const overflow = atRisk.length - visible.length;
  const singleTarget = atRisk.length === 1 ? atRisk[0] : null;

  // When there's only 1 at-risk company, clicking anywhere in the panel filters to it.
  const headerClickable = Boolean(singleTarget && onCompanySelect);

  return (
    <div className="border-y border-border/60 py-4">
      <button
        type="button"
        disabled={!headerClickable}
        onClick={
          headerClickable && singleTarget
            ? () => onCompanySelect?.(singleTarget.companyId)
            : undefined
        }
        className={cn(
          'mb-3 flex w-full items-start gap-2.5 rounded-md text-left',
          headerClickable && 'cursor-pointer transition-colors hover:bg-foreground/[0.025]',
          !headerClickable && 'cursor-default',
        )}
      >
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500"
          strokeWidth={1.8}
        />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {t('statusReports.actionNeeded.title')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('statusReports.actionNeeded.subtitle', { count: atRisk.length })}
          </p>
        </div>
        {headerClickable && (
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
        )}
      </button>

      <ul className="space-y-1">
        {visible.map((c) => {
          const clickable = Boolean(onCompanySelect);
          return (
            <li key={c.companyId}>
              <button
                type="button"
                disabled={!clickable}
                onClick={clickable ? () => onCompanySelect?.(c.companyId) : undefined}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-md border border-transparent px-2 py-2 text-left',
                  clickable &&
                    'cursor-pointer transition-colors hover:border-border hover:bg-foreground/[0.03]',
                )}
              >
                <span className={cn('h-2 w-2 shrink-0 rounded-full', dotClass[c.band])} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{c.tradeName}</p>
                  <p className="truncate text-[11px] text-muted-foreground tabular-nums">
                    {t('statusReports.actionNeeded.row', {
                      onTime: c.onTime,
                      expected: c.expected,
                      late: c.late,
                      missed: c.missed,
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums',
                    scorePillClass[c.band],
                  )}
                >
                  {Math.round(c.score * 100)}%
                </span>
                {clickable && (
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {overflow > 0 && (
        <p className="mt-2 px-2 text-[11px] text-muted-foreground">
          {t('statusReports.actionNeeded.more', { count: overflow })}
        </p>
      )}
    </div>
  );
}
