import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { DashboardHeaderDto } from '@nhb-status-report/shared';

interface FreshnessBadgeProps {
  freshness: DashboardHeaderDto['freshness'];
  daysSinceImport: number | null;
}

export function FreshnessBadge({
  freshness,
  daysSinceImport,
}: FreshnessBadgeProps) {
  const { t } = useTranslation();
  if (!freshness || daysSinceImport === null) return null;
  const label =
    freshness === 'GREEN'
      ? t('projectTracking.freshness.green')
      : freshness === 'AMBER'
        ? t('projectTracking.freshness.amber', { days: daysSinceImport })
        : t('projectTracking.freshness.red', { days: daysSinceImport });

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        freshness === 'GREEN' &&
          'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        freshness === 'AMBER' &&
          'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        freshness === 'RED' &&
          'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          freshness === 'GREEN' && 'bg-emerald-500',
          freshness === 'AMBER' && 'bg-amber-500',
          freshness === 'RED' && 'bg-rose-500',
        )}
      />
      {label}
    </span>
  );
}
