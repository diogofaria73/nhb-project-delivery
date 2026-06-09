import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CompanyCompliance, ComplianceBand } from '@/types';

interface Props {
  data: CompanyCompliance[];
  loading: boolean;
}

const barColors: Record<ComplianceBand, string> = {
  green: 'bg-emerald-500/80',
  amber: 'bg-amber-500/80',
  red: 'bg-destructive/80',
};

const dotColors: Record<ComplianceBand, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-destructive',
};

const DEFAULT_PAGE_SIZE = 12;

export function CompanyAdherenceBars({ data, loading }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [bandFilter, setBandFilter] = useState<'all' | ComplianceBand>('all');
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return data.filter((c) => {
      if (bandFilter !== 'all' && c.band !== bandFilter) return false;
      if (needle && !c.tradeName.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [data, search, bandFilter]);

  const hasAnyDelivery = data.some((c) => c.onTime + c.late > 0);

  const visible = showAll ? filtered : filtered.slice(0, DEFAULT_PAGE_SIZE);

  return (
    <div className="border-y border-border/60 py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {t('statusReportAnalytics.bars.title')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('statusReportAnalytics.bars.description')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('statusReportAnalytics.bars.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-sm w-[220px]"
            />
          </div>
          <div className="flex items-center gap-1">
            <PillButton
              label={t('statusReportAnalytics.bars.allBands')}
              active={bandFilter === 'all'}
              onClick={() => setBandFilter('all')}
            />
            <PillButton
              label={t('statusReportAnalytics.bars.bands.green')}
              active={bandFilter === 'green'}
              onClick={() => setBandFilter('green')}
              tone="good"
            />
            <PillButton
              label={t('statusReportAnalytics.bars.bands.amber')}
              active={bandFilter === 'amber'}
              onClick={() => setBandFilter('amber')}
              tone="warn"
            />
            <PillButton
              label={t('statusReportAnalytics.bars.bands.red')}
              active={bandFilter === 'red'}
              onClick={() => setBandFilter('red')}
              tone="bad"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t('common.loading')}</p>
      ) : !hasAnyDelivery ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t('statusReportAnalytics.bars.noDeliveries')}
        </p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t('statusReportAnalytics.bars.empty')}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((c) => (
            <li key={c.companyId} className="grid grid-cols-[200px_1fr_72px] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground inline-flex items-center gap-2">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', dotColors[c.band])} />
                  {c.tradeName}
                </p>
              </div>
              <div className="h-2 rounded-full bg-foreground/[0.06] overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', barColors[c.band])}
                  style={{ width: `${Math.max(2, c.score * 100)}%` }}
                />
              </div>
              <p className="text-right text-sm font-semibold tabular-nums text-foreground">
                {Math.round(c.score * 100)}%
                <span className="ml-1 text-[10px] font-normal text-muted-foreground tabular-nums">
                  {c.onTime}/{c.expected}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}

      {filtered.length > DEFAULT_PAGE_SIZE && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((v) => !v)}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            {showAll
              ? t('statusReportAnalytics.bars.showLess')
              : t('statusReportAnalytics.bars.showAll', {
                  count: filtered.length - DEFAULT_PAGE_SIZE,
                })}
          </Button>
        </div>
      )}
    </div>
  );
}

function PillButton({
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
      className={cn('h-7 px-2.5 text-[11px] font-medium text-muted-foreground', toneClass)}
    >
      {label}
    </Button>
  );
}
