import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProjectRowDto, ProjectStatus } from '@nhb-status-report/shared';
import { ProjectWeekStrip } from './project-week-strip';

const STATUS_OPTIONS: Array<{ value: 'ALL' | ProjectStatus; key: string }> = [
  { value: 'ALL', key: 'projectTracking.table.statusAll' },
  { value: 'ACTIVE', key: 'projectTracking.status.ACTIVE' },
  { value: 'ON_HOLD', key: 'projectTracking.status.ON_HOLD' },
  { value: 'COMPLETED', key: 'projectTracking.status.COMPLETED' },
  { value: 'CANCELLED', key: 'projectTracking.status.CANCELLED' },
  { value: 'NOT_STARTED', key: 'projectTracking.status.NOT_STARTED' },
];

const PAGE_SIZE = 50;

interface ProjectTableProps {
  projects: ProjectRowDto[];
  weeksInYear: number;
  currentWeek: number;
  onSelectProject: (snapshotId: string) => void;
}

type SortKey = 'projectId' | 'projectName' | 'projectStatus' | 'compliance';

export function ProjectTable({
  projects,
  weeksInYear,
  currentWeek,
  onSelectProject,
}: ProjectTableProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus>('ALL');
  const [pmFilter, setPmFilter] = useState<'ALL' | string>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('compliance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const pmOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) if (p.pm) set.add(p.pm);
    return ['ALL', ...Array.from(set).sort()];
  }, [projects]);

  const filtered = useMemo(() => {
    const search_lower = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== 'ALL' && p.projectStatus !== statusFilter)
        return false;
      if (pmFilter !== 'ALL' && p.pm !== pmFilter) return false;
      if (!search_lower) return true;
      return (
        p.projectId.toLowerCase().includes(search_lower) ||
        p.projectName.toLowerCase().includes(search_lower)
      );
    });
  }, [projects, search, statusFilter, pmFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const sign = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      if (sortBy === 'projectId') return sign * a.projectId.localeCompare(b.projectId);
      if (sortBy === 'projectName')
        return sign * a.projectName.localeCompare(b.projectName);
      if (sortBy === 'projectStatus')
        return sign * a.projectStatus.localeCompare(b.projectStatus);
      // compliance
      const ac = a.compliancePercent ?? -1;
      const bc = b.compliancePercent ?? -1;
      return sign * (ac - bc);
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir(key === 'compliance' ? 'asc' : 'asc');
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('projectTracking.table.searchPlaceholder')}
            className="max-w-xs"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as 'ALL' | ProjectStatus);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={pmFilter}
            onValueChange={(v) => {
              setPmFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pmOptions.map((pm) => (
                <SelectItem key={pm} value={pm}>
                  {pm === 'ALL' ? t('projectTracking.table.pmAll') : pm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="ml-auto text-xs text-muted-foreground">
            {t('projectTracking.table.showing', {
              count: paged.length,
              total: sorted.length,
            })}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <SortableTh sortKey="projectId" current={sortBy} dir={sortDir} onClick={() => toggleSort('projectId')}>
                  {t('projectTracking.table.col.projectId')}
                </SortableTh>
                <SortableTh sortKey="projectName" current={sortBy} dir={sortDir} onClick={() => toggleSort('projectName')}>
                  {t('projectTracking.table.col.projectName')}
                </SortableTh>
                <SortableTh sortKey="projectStatus" current={sortBy} dir={sortDir} onClick={() => toggleSort('projectStatus')}>
                  {t('projectTracking.table.col.status')}
                </SortableTh>
                <th className="px-2 py-2">PM</th>
                <SortableTh
                  sortKey="compliance"
                  current={sortBy}
                  dir={sortDir}
                  onClick={() => toggleSort('compliance')}
                  className="text-right"
                >
                  {t('projectTracking.table.col.compliance')}
                </SortableTh>
                <th className="px-2 py-2">
                  {t('projectTracking.table.col.timeline')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr
                  key={p.snapshotId}
                  className="cursor-pointer border-b hover:bg-muted/30"
                  onClick={() => onSelectProject(p.snapshotId)}
                >
                  <td className="px-2 py-2 font-mono text-xs">{p.projectId}</td>
                  <td className="px-2 py-2 max-w-[280px] truncate">{p.projectName}</td>
                  <td className="px-2 py-2">
                    <StatusBadge status={p.projectStatus} />
                  </td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{p.pm ?? '—'}</td>
                  <td className="px-2 py-2 text-right">
                    {p.compliancePercent === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span>{p.compliancePercent.toFixed(0)}%</span>
                    )}
                    <span className="ml-1 text-[11px] text-muted-foreground">
                      ({p.weeksSent}/{p.weeksExpected})
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <ProjectWeekStrip
                      weekFlagsBase64={p.weekFlagsBase64}
                      weeksInYear={weeksInYear}
                      currentWeek={currentWeek}
                      firstActiveWeek={p.firstActiveWeek}
                      projectStatus={p.projectStatus}
                    />
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    {t('projectTracking.table.emptyMatch')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t('common.previous')}
            </Button>
            <p className="text-xs text-muted-foreground">
              {safePage} / {totalPages}
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SortableThProps {
  children: React.ReactNode;
  sortKey: SortKey;
  current: SortKey;
  dir: 'asc' | 'desc';
  onClick: () => void;
  className?: string;
}

function SortableTh({ children, sortKey, current, dir, onClick, className }: SortableThProps) {
  const isActive = sortKey === current;
  return (
    <th className={cn('px-2 py-2', className)}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {children}
        {isActive && (
          <span className="text-[10px]">{dir === 'asc' ? '▲' : '▼'}</span>
        )}
      </button>
    </th>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useTranslation();
  const colors: Record<ProjectStatus, string> = {
    ACTIVE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    ON_HOLD: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    COMPLETED: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    CANCELLED: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    NOT_STARTED: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        colors[status],
      )}
    >
      {t(`projectTracking.status.${status}`)}
    </span>
  );
}
