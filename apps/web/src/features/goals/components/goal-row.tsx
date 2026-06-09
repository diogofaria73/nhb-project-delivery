import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Archive, ArchiveRestore, ArrowRight, MoreHorizontal, Pencil, Trash2, Package, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { GoalResponse } from '@/types';

type Band = 'green' | 'amber' | 'red';

function bandFor(rate: number): Band {
  if (rate >= 0.9) return 'green';
  if (rate >= 0.5) return 'amber';
  return 'red';
}

const accentClasses: Record<Band, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-destructive',
};

const progressClasses: Record<Band, string> = {
  green: 'bg-emerald-500/80',
  amber: 'bg-amber-500/80',
  red: 'bg-destructive/80',
};

interface Props {
  goal: GoalResponse;
  isAdmin: boolean;
  onEdit: (g: GoalResponse) => void;
  onArchive: (g: GoalResponse) => void;
  onDelete: (g: GoalResponse) => void;
}

export function GoalRow({ goal, isAdmin, onEdit, onArchive, onDelete }: Props) {
  const { t } = useTranslation();
  const s = goal.summary ?? {
    eligibleCompanies: 0,
    companiesHit: 0,
    totalDelivered: 0,
    totalOnTime: 0,
    aggregateHitRate: 0,
  };
  const band = bandFor(s.aggregateHitRate);
  const hitPct = Math.round(s.aggregateHitRate * 100);

  return (
    <div className="group relative flex items-center gap-4 py-3.5 pl-5 pr-3 hover:bg-foreground/[0.02] transition-colors">
      <span
        aria-hidden
        className={cn('absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full', accentClasses[band])}
      />

      <Link to={`/goals/${goal.id}`} className="flex-1 min-w-0 flex items-center gap-4">
        <div className="min-w-0 w-[200px]">
          <p className="text-sm font-semibold text-foreground truncate">{goal.periodLabel}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('goals.row.windowDates', { from: goal.startDate, to: goal.endDate })}
          </p>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" strokeWidth={1.8} />
            <span className="tabular-nums text-foreground">{goal.deliveriesPerPeriod}</span>
            {t('goals.row.deliveriesUnit')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.8} />
            {t('goals.row.deadlineDay', { day: goal.monthlyDeadlineDay })}
          </span>
        </div>

        <div className="flex-1 min-w-[160px] max-w-[260px]">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>
              <span className="font-semibold text-foreground">{s.companiesHit}</span>
              {` / ${s.eligibleCompanies}`}
            </span>
            <span>{hitPct}%</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', progressClasses[band])}
              style={{ width: `${Math.max(2, hitPct)}%` }}
            />
          </div>
        </div>

        <ArrowRight className="hidden lg:block h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuItem onClick={() => onEdit(goal)} className="text-sm">
              <Pencil className="mr-2 h-3.5 w-3.5" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive(goal)} className="text-sm">
              {goal.isArchived ? (
                <>
                  <ArchiveRestore className="mr-2 h-3.5 w-3.5" />
                  {t('goals.actions.unarchive')}
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-3.5 w-3.5" />
                  {t('goals.actions.archive')}
                </>
              )}
            </DropdownMenuItem>
            {goal.status === 'upcoming' && (
              <DropdownMenuItem onClick={() => onDelete(goal)} className="text-sm text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {t('common.delete')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
