import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { HeatmapResponse, HeatmapStatus } from '@/types';

interface Props {
  data: HeatmapResponse | null;
  loading: boolean;
}

const statusClass: Record<HeatmapStatus, string> = {
  'on-time': 'bg-emerald-500/80',
  late: 'bg-amber-500/80',
  missed: 'bg-destructive/80',
  inactive: 'bg-muted',
};

function formatMonth(ym: string): string {
  const parts = ym.split('-');
  const y = parts[0] ?? '';
  const m = parts[1] ?? '';
  return `${m}/${y.slice(2)}`;
}

export function ComplianceHeatmap({ data, loading }: Props) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">
          {t('statusReportAnalytics.heatmap.title')}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('statusReportAnalytics.heatmap.description')}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-12 text-center">{t('common.loading')}</p>
      ) : !data || data.companies.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          {t('statusReportAnalytics.heatmap.empty')}
        </p>
      ) : !data.companies.some((c) => c.cells.some((cell) => cell.status === 'on-time' || cell.status === 'late')) ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          {t('statusReportAnalytics.heatmap.noDeliveries')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card pr-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('statusReportAnalytics.heatmap.company')}
                </th>
                {data.months.map((m) => (
                  <th
                    key={m}
                    className="text-[10px] font-semibold tabular-nums text-muted-foreground"
                  >
                    {formatMonth(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.companies.map((c) => (
                <tr key={c.companyId}>
                  <td className="sticky left-0 z-10 bg-card pr-3 text-xs font-medium text-foreground max-w-[180px] truncate">
                    {c.tradeName}
                  </td>
                  {c.cells.map((cell) => (
                    <td key={`${c.companyId}-${cell.month}`} className="p-0">
                      <div
                        className={cn(
                          'h-6 w-6 rounded',
                          statusClass[cell.status],
                          'transition-transform hover:scale-110',
                        )}
                        title={`${c.tradeName} — ${cell.month} — ${t(`statusReportAnalytics.heatmap.statuses.${cell.status}`)}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <Legend swatch="bg-emerald-500/80" label={t('statusReportAnalytics.heatmap.statuses.on-time')} />
        <Legend swatch="bg-amber-500/80" label={t('statusReportAnalytics.heatmap.statuses.late')} />
        <Legend swatch="bg-destructive/80" label={t('statusReportAnalytics.heatmap.statuses.missed')} />
        <Legend swatch="bg-muted" label={t('statusReportAnalytics.heatmap.statuses.inactive')} />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-3 w-3 rounded', swatch)} />
      {label}
    </span>
  );
}
