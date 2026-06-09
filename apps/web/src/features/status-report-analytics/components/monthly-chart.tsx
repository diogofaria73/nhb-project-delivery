import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import type { AnalyticsOverview } from '@/types';

interface Props {
  overview: AnalyticsOverview | null;
  loading: boolean;
}

export function MonthlyChart({ overview, loading }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'absolute' | 'percent'>('absolute');

  const data = (overview?.monthly ?? []).map((b) => {
    const expected = b.expected || 1; // guard for division
    if (mode === 'percent') {
      return {
        month: b.month,
        onTime: +((b.onTime / expected) * 100).toFixed(1),
        late: +((b.late / expected) * 100).toFixed(1),
        missed: +((b.missed / expected) * 100).toFixed(1),
      };
    }
    return {
      month: b.month,
      onTime: b.onTime,
      late: b.late,
      missed: b.missed,
    };
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {t('statusReportAnalytics.monthlyChart.title')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('statusReportAnalytics.monthlyChart.description')}
          </p>
        </div>
        <div className="flex rounded-md border border-border bg-card p-0.5">
          <Button
            type="button"
            size="sm"
            variant={mode === 'absolute' ? 'secondary' : 'ghost'}
            className="h-7 px-2.5 text-xs"
            onClick={() => setMode('absolute')}
          >
            {t('statusReportAnalytics.monthlyChart.absolute')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'percent' ? 'secondary' : 'ghost'}
            className="h-7 px-2.5 text-xs"
            onClick={() => setMode('percent')}
          >
            {t('statusReportAnalytics.monthlyChart.percent')}
          </Button>
        </div>
      </div>

      <div className="h-[280px]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : data.length === 0 || data.every((d) => d.onTime === 0 && d.late === 0) ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t('statusReportAnalytics.monthlyChart.noDeliveries')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(v) => (mode === 'percent' ? `${v}%` : `${v}`)}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value) =>
                  mode === 'percent' ? `${value as number}%` : (value as number)
                }
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="onTime"
                stackId="s"
                fill="hsl(var(--ring))"
                name={t('statusReportAnalytics.monthlyChart.onTime')}
              />
              <Bar
                dataKey="late"
                stackId="s"
                fill="hsl(38 92% 50%)"
                name={t('statusReportAnalytics.monthlyChart.late')}
              />
              <Bar
                dataKey="missed"
                stackId="s"
                fill="hsl(var(--destructive))"
                name={t('statusReportAnalytics.monthlyChart.missed')}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
