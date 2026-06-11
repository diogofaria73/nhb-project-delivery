import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import type { WeeklyBarDto } from '@nhb-status-report/shared';

interface WeeklyBarChartProps {
  bars: WeeklyBarDto[];
}

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WeeklyBarDto }>;
}

export function WeeklyBarChart({ bars }: WeeklyBarChartProps) {
  const { t } = useTranslation();
  const data = bars.map((bar) => ({
    ...bar,
    percentValue: bar.percent ?? 0,
  }));

  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('projectTracking.charts.weeklyComplianceTitle')}
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, bottom: 4, left: -12 }}
            >
              <CartesianGrid
                stroke="hsl(var(--border))"
                strokeOpacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="isoWeek"
                tick={{ fontSize: 10 }}
                interval={3}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                content={<WeeklyBarTooltip />}
              />
              <Bar dataKey="percentValue" radius={[2, 2, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.isoWeek}
                    fill={
                      entry.isFuture
                        ? 'hsl(var(--muted-foreground) / 0.25)'
                        : 'hsl(var(--primary))'
                    }
                    stroke={entry.isCurrent ? 'hsl(var(--foreground))' : 'none'}
                    strokeWidth={entry.isCurrent ? 1.5 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyBarTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  const bar = payload[0]!.payload;
  return (
    <div className="rounded-md border border-border/60 bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">ISO {bar.isoWeek}</p>
      <p className="text-muted-foreground">
        {bar.sentCount} / {bar.expectedCount}
        {bar.percent !== null && (
          <span className="ml-1">({bar.percent.toFixed(0)}%)</span>
        )}
      </p>
    </div>
  );
}
