import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GoalBreakdownRow, GoalRowStatus } from '@/types';

interface Props {
  rows: GoalBreakdownRow[];
  expected: number;
  showProjection: boolean;
}

const statusClasses: Record<GoalRowStatus, string> = {
  hit: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'at-risk': 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'off-track': 'bg-destructive/15 text-destructive',
};

const progressClasses: Record<GoalRowStatus, string> = {
  hit: 'bg-emerald-500/80',
  'at-risk': 'bg-amber-500/80',
  'off-track': 'bg-destructive/80',
};

export function GoalBreakdownTable({ rows, expected, showProjection }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GoalRowStatus>('all');

  const counts = useMemo(() => {
    const c = { all: rows.length, hit: 0, 'at-risk': 0, 'off-track': 0 };
    for (const r of rows) {
      const effective = showProjection && r.projected ? r.projected.status : r.status;
      c[effective] += 1;
    }
    return c;
  }, [rows, showProjection]);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return rows.filter((r) => {
      const effective = showProjection && r.projected ? r.projected.status : r.status;
      if (statusFilter !== 'all' && effective !== statusFilter) return false;
      if (needle && !r.tradeName.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [rows, search, statusFilter, showProjection]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1 sm:max-w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('goals.breakdown.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-1">
          <Pill
            label={`${t('goals.breakdown.allStatus')} · ${counts.all}`}
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
          <Pill
            label={`${t('goals.rowStatus.hit')} · ${counts.hit}`}
            active={statusFilter === 'hit'}
            onClick={() => setStatusFilter('hit')}
            tone="good"
          />
          <Pill
            label={`${t('goals.rowStatus.atRisk')} · ${counts['at-risk']}`}
            active={statusFilter === 'at-risk'}
            onClick={() => setStatusFilter('at-risk')}
            tone="warn"
          />
          <Pill
            label={`${t('goals.rowStatus.offTrack')} · ${counts['off-track']}`}
            active={statusFilter === 'off-track'}
            onClick={() => setStatusFilter('off-track')}
            tone="bad"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border-y border-border/60 py-12 text-center">
          <p className="text-sm text-muted-foreground">{t('goals.breakdown.empty')}</p>
        </div>
      ) : (
        <div className="border-y border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-5">
                  {t('goals.breakdown.columns.company')}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                  {t('goals.breakdown.columns.delivered')}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                  {t('goals.breakdown.columns.onTime')}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                  {t('goals.breakdown.columns.late')}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                  {t('goals.breakdown.columns.missing')}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right pr-5">
                  {t('goals.breakdown.columns.status')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const projected = showProjection && row.projected ? row.projected : null;
                const status = projected ? projected.status : row.status;
                const delivered = projected ? projected.delivered : row.delivered;
                const onTime = projected ? projected.onTime : row.onTime;
                const late = Math.max(0, delivered - onTime);
                const missing = Math.max(0, expected - delivered);
                const progress = expected === 0 ? 0 : Math.min(1, onTime / expected);
                return (
                  <TableRow key={row.companyId} className="border-border/60 hover:bg-foreground/[0.02]">
                    <TableCell className="py-3 pl-5">
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-foreground">{row.tradeName}</p>
                        <div className="h-1.5 w-full max-w-[240px] rounded-full bg-foreground/[0.06] overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', progressClasses[status])}
                            style={{ width: `${Math.max(2, progress * 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground text-right tabular-nums">
                      {delivered}
                    </TableCell>
                    <TableCell className="text-sm text-foreground text-right tabular-nums">
                      {onTime}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground text-right tabular-nums">
                      {late}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground text-right tabular-nums">
                      {missing}
                    </TableCell>
                    <TableCell className="text-right pr-5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs font-semibold rounded-md px-2.5 py-0.5 border-0',
                          statusClasses[status],
                        )}
                      >
                        {t(
                          `goals.rowStatus.${
                            status === 'at-risk'
                              ? 'atRisk'
                              : status === 'off-track'
                                ? 'offTrack'
                                : 'hit'
                          }`,
                        )}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function Pill({
  label,
  active,
  onClick,
  tone,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  tone?: 'good' | 'warn' | 'bad';
}) {
  const toneClass =
    tone === 'good'
      ? 'data-[active=true]:bg-emerald-500/15 data-[active=true]:text-emerald-700 dark:data-[active=true]:text-emerald-400'
      : tone === 'warn'
        ? 'data-[active=true]:bg-amber-500/15 data-[active=true]:text-amber-700 dark:data-[active=true]:text-amber-400'
        : tone === 'bad'
          ? 'data-[active=true]:bg-destructive/15 data-[active=true]:text-destructive'
          : 'data-[active=true]:bg-foreground/[0.08] data-[active=true]:text-foreground';
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-active={active ? 'true' : 'false'}
      onClick={onClick}
      className={cn('h-7 px-2.5 text-[11px] font-medium text-muted-foreground tabular-nums', toneClass)}
    >
      {label}
    </Button>
  );
}
