import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  CurrentWeekKpiDto,
  PortfolioKpiDto,
  AnnualConsolidatedKpiDto,
} from '@nhb-status-report/shared';

interface KpiCardsProps {
  portfolio: PortfolioKpiDto;
  currentWeek: CurrentWeekKpiDto;
  annual: AnnualConsolidatedKpiDto;
}

function formatPct(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(value < 10 ? 1 : 0)}%`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
}

export function KpiCards({ portfolio, currentWeek, annual }: KpiCardsProps) {
  const { t } = useTranslation();
  const rangeLabel = `${formatDate(currentWeek.weekStart)} – ${formatDate(currentWeek.weekEnd)}`;

  const buckets: Array<{
    key: string;
    label: string;
    count: number;
    accent: string;
  }> = [
    {
      key: 'total',
      label: t('projectTracking.kpi.totalProjects'),
      count: portfolio.totalProjects,
      accent: 'text-foreground',
    },
    {
      key: 'active',
      label: t('projectTracking.status.ACTIVE'),
      count: portfolio.active,
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      key: 'onHold',
      label: t('projectTracking.status.ON_HOLD'),
      count: portfolio.onHold,
      accent: 'text-amber-600 dark:text-amber-400',
    },
    {
      key: 'completed',
      label: t('projectTracking.status.COMPLETED'),
      count: portfolio.completed,
      accent: 'text-sky-600 dark:text-sky-400',
    },
    {
      key: 'cancelled',
      label: t('projectTracking.status.CANCELLED'),
      count: portfolio.cancelled,
      accent: 'text-rose-600 dark:text-rose-400',
    },
    {
      key: 'notStarted',
      label: t('projectTracking.status.NOT_STARTED'),
      count: portfolio.notStarted,
      accent: 'text-zinc-500 dark:text-zinc-400',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('projectTracking.kpi.currentWeekTitle', {
                week: currentWeek.isoWeek,
              })}
              <span className="ml-2 font-normal normal-case text-muted-foreground/70">
                {rangeLabel}
              </span>
            </p>
            <p className="text-3xl font-semibold">
              {formatPct(currentWeek.percent)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('projectTracking.kpi.currentWeekDetail', {
                sent: currentWeek.sentThisWeek,
                total: currentWeek.activeProjects,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('projectTracking.kpi.annualConsolidated')}
            </p>
            <p className="text-3xl font-semibold">
              {formatPct(annual.percent)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('projectTracking.kpi.annualDetail', {
                sent: annual.weeksSent,
                expected: annual.weeksExpected,
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {buckets.map((bucket) => (
          <Card key={bucket.key}>
            <CardContent className="space-y-1 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {bucket.label}
              </p>
              <p className={cn('text-2xl font-semibold', bucket.accent)}>
                {bucket.count}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {portfolio.totalProjects > 0
                  ? `${((bucket.count / portfolio.totalProjects) * 100).toFixed(0)}%`
                  : '—'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
