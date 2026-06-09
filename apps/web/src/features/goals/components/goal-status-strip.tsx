import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Target } from 'lucide-react';
import { useGoals } from '../hooks/use-goals';
import { cn } from '@/lib/utils';

function bandFor(rate: number): 'green' | 'amber' | 'red' {
  if (rate >= 0.9) return 'green';
  if (rate >= 0.5) return 'amber';
  return 'red';
}

const bandClasses = {
  green: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  red: 'bg-destructive/15 text-destructive',
};

export function GoalStatusStrip() {
  const { t } = useTranslation();
  const { goals, loading } = useGoals('active');

  if (loading || goals.length === 0) return null;

  return (
    <div className="border-y border-border/60 py-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t('goals.analyticsStrip.title')}
      </p>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {goals.map((g) => {
          const summary = g.summary ?? {
            eligibleCompanies: 0,
            companiesHit: 0,
            totalDelivered: 0,
            totalOnTime: 0,
            aggregateHitRate: 0,
          };
          const band = bandFor(summary.aggregateHitRate);
          return (
            <Link
              key={g.id}
              to={`/goals/${g.id}`}
              className="inline-flex items-center gap-2 text-xs hover:underline underline-offset-4"
            >
              <Target className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
              <span className="font-semibold text-foreground">{g.periodLabel}</span>
              <span className="text-muted-foreground tabular-nums">
                {t('goals.analyticsStrip.expected', { count: g.deliveriesPerPeriod })}
              </span>
              <span
                className={cn(
                  'tabular-nums rounded-md px-2 py-0.5 text-[11px] font-semibold',
                  bandClasses[band],
                )}
              >
                {summary.companiesHit}/{summary.eligibleCompanies}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
