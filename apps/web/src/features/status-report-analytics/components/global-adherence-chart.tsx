import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Globe2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalyticsOverview } from '@/types';

interface Props {
  overview: AnalyticsOverview | null;
  loading: boolean;
  scopeLabel: string;
  isGlobal: boolean;
}

function tone(rate: number): 'good' | 'warn' | 'bad' {
  if (rate >= 0.9) return 'good';
  if (rate >= 0.6) return 'warn';
  return 'bad';
}

const ringColors = {
  good: 'hsl(160 84% 39%)', // emerald-500
  warn: 'hsl(38 92% 50%)', // amber-500
  bad: 'hsl(0 70% 50%)', // destructive
};

const numberToneClasses = {
  good: 'text-emerald-700 dark:text-emerald-400',
  warn: 'text-amber-700 dark:text-amber-400',
  bad: 'text-destructive',
};

export function GlobalAdherenceChart({ overview, loading, scopeLabel, isGlobal }: Props) {
  const { t } = useTranslation();
  const k = overview?.kpis;
  const expected = k?.expected ?? 0;
  const onTime = k?.onTime ?? 0;
  const late = k?.late ?? 0;
  const missed = k?.missed ?? 0;
  const rate = expected === 0 ? 0 : onTime / expected;
  const colorTone = tone(rate);
  const ringColor = ringColors[colorTone];

  const data = [
    { name: t('statusReportAnalytics.donut.onTime'), value: onTime, color: ringColor },
    { name: t('statusReportAnalytics.donut.late'), value: late, color: 'hsl(38 92% 50%)' },
    { name: t('statusReportAnalytics.donut.missed'), value: missed, color: 'hsl(0 70% 50%)' },
  ];
  const delivered = onTime + late;
  const hasData = delivered > 0;

  return (
    <div className="border-y border-border/60 py-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-3 md:w-[220px]">
          {isGlobal ? (
            <Globe2 className="h-5 w-5 text-muted-foreground" strokeWidth={1.7} />
          ) : (
            <Building2 className="h-5 w-5 text-muted-foreground" strokeWidth={1.7} />
          )}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('statusReportAnalytics.donut.scope')}
            </p>
            <p className="text-sm font-semibold text-foreground">{scopeLabel}</p>
          </div>
        </div>

        <div className="relative h-[180px] w-[180px] shrink-0 mx-auto md:mx-0">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : !hasData ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-2">
              <span className="text-xs text-muted-foreground">
                {t('statusReportAnalytics.donut.noDeliveries')}
              </span>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value, name) => [value as number, name as string]}
                  />
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={84}
                    paddingAngle={2}
                    strokeWidth={0}
                    isAnimationActive
                  >
                    {data.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-3xl font-semibold tabular-nums', numberToneClasses[colorTone])}>
                  {Math.round(rate * 100)}%
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('statusReportAnalytics.donut.onTime')}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right side: legend / stats list */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/60">
          <StatBlock label={t('statusReportAnalytics.kpis.expected')} value={expected} />
          <StatBlock
            label={t('statusReportAnalytics.kpis.onTime')}
            value={onTime}
            dot="bg-emerald-500"
          />
          <StatBlock
            label={t('statusReportAnalytics.kpis.late')}
            value={late}
            dot="bg-amber-500"
          />
          <StatBlock
            label={t('statusReportAnalytics.kpis.missed')}
            value={missed}
            dot="bg-destructive"
          />
        </div>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  dot,
}: {
  label: string;
  value: number;
  dot?: string;
}) {
  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-1.5">
        {dot && <span className={cn('h-2 w-2 rounded-full', dot)} />}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
