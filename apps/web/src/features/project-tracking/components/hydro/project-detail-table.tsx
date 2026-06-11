import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import type { ProjectRowDto, ProjectStatus } from '@nhb-status-report/shared';
import {
  cumulativePercentForTable,
  decodeWeekFlags,
  formatPctPtBr,
} from '../../lib/compute';
import { canonicalStatusIndex, STATUS_COLORS, withAlpha } from './status-meta';
import { StatusPill } from './status-pill';
import { ProgressMini } from './progress-mini';

type SortKey = 'name' | 'status' | 'sentThisWeek' | 'cumulative';
type SortDir = 'asc' | 'desc';

interface ProjectDetailTableProps {
  projects: ProjectRowDto[];
  totalVisible: number;
  weekN: number;
  donutFocus: ProjectStatus | null;
  onClearDonutFocus: () => void;
}

interface Row {
  project: ProjectRowDto;
  cumulativePct: number;
  sentThisWeek: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 15;

export function ProjectDetailTable({
  projects,
  totalVisible,
  weekN,
  donutFocus,
  onClearDonutFocus,
}: ProjectDetailTableProps) {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<SortKey>('cumulative');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);

  const rows: Row[] = useMemo(
    () =>
      projects.map((p) => {
        const flags = decodeWeekFlags(p.weekFlagsBase64);
        return {
          project: p,
          cumulativePct: cumulativePercentForTable(flags, weekN),
          sentThisWeek: flags[weekN - 1] ?? false,
        };
      }),
    [projects, weekN],
  );

  const sorted = useMemo(() => {
    const arr = [...rows];
    const sign = sortDir === 'asc' ? 1 : -1;
    const byName = (a: Row, b: Row) =>
      a.project.projectName.localeCompare(b.project.projectName, 'pt');
    arr.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return sign * byName(a, b);
        case 'status': {
          const diff =
            canonicalStatusIndex(a.project.projectStatus) -
            canonicalStatusIndex(b.project.projectStatus);
          return diff !== 0 ? sign * diff : byName(a, b);
        }
        case 'sentThisWeek': {
          const diff = Number(a.sentThisWeek) - Number(b.sentThisWeek);
          return diff !== 0 ? sign * diff : byName(a, b);
        }
        case 'cumulative': {
          const diff = a.cumulativePct - b.cumulativePct;
          return diff !== 0 ? sign * diff : byName(a, b);
        }
      }
    });
    return arr;
  }, [rows, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const startIdx = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, sorted.length);

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir(key === 'cumulative' ? 'desc' : 'asc');
    }
    setPage(1);
  }

  const total = totalVisible;
  const shown = rows.length;
  const totalAverage =
    rows.length === 0
      ? 0
      : rows.reduce((sum, r) => sum + r.cumulativePct, 0) / rows.length;

  const subtitleEl = donutFocus ? (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ color: 'var(--hy-ink-dim)' }}>
        {t('dashboard.table.subtitleFiltered', { shown, total })}
      </span>
      <button
        type="button"
        onClick={onClearDonutFocus}
        className="hy-pill"
        style={{
          background: withAlpha(STATUS_COLORS[donutFocus], '1f'),
          borderColor: withAlpha(STATUS_COLORS[donutFocus], '66'),
          color: STATUS_COLORS[donutFocus],
          cursor: 'pointer',
        }}
      >
        <span
          className="hy-pill-dot"
          style={{ background: STATUS_COLORS[donutFocus] }}
        />
        {t(`dashboard.status.${donutFocus}`)}
        <X size={12} />
      </button>
    </span>
  ) : (
    <span style={{ color: 'var(--hy-ink-dim)' }}>
      {t('dashboard.table.subtitleN', { n: shown })}
    </span>
  );

  return (
    <div className="hy-panel">
      <div
        className="hy-panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div className="hy-panel-title">{t('dashboard.table.panelTitle')}</div>
          <div className="hy-panel-subtitle">{subtitleEl}</div>
        </div>
        <PageSizeSelector
          value={pageSize}
          onChange={(v) => {
            setPageSize(v);
            setPage(1);
          }}
        />
      </div>

      <div className="hy-panel-body" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13.5,
            }}
          >
            <thead>
              <tr>
                <Th
                  onClick={() => toggleSort('name')}
                  active={sortBy === 'name'}
                  dir={sortDir}
                >
                  {t('dashboard.table.col.project')}
                </Th>
                <Th
                  onClick={() => toggleSort('status')}
                  active={sortBy === 'status'}
                  dir={sortDir}
                >
                  {t('dashboard.table.col.status')}
                </Th>
                <Th
                  onClick={() => toggleSort('sentThisWeek')}
                  active={sortBy === 'sentThisWeek'}
                  dir={sortDir}
                  align="center"
                >
                  {t('dashboard.table.col.sentThisWeek')}
                </Th>
                <Th
                  onClick={() => toggleSort('cumulative')}
                  active={sortBy === 'cumulative'}
                  dir={sortDir}
                  align="right"
                >
                  {t('dashboard.table.col.cumulative')}
                </Th>
              </tr>
            </thead>
            <tbody>
              {paged.map(({ project, cumulativePct, sentThisWeek }, idx) => (
                <tr
                  key={project.snapshotId}
                  style={{
                    borderBottom:
                      idx === paged.length - 1
                        ? 'none'
                        : '1px solid var(--hy-row-border)',
                    transition: 'background .15s ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(98, 179, 168, 0.04)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <Td>
                    <span style={{ fontWeight: 500 }}>{project.projectName}</span>
                  </Td>
                  <Td>
                    <StatusPill status={project.projectStatus} />
                  </Td>
                  <Td align="center">
                    <SentBadge sent={sentThisWeek} t={t} />
                  </Td>
                  <Td align="right">
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <ProgressMini percent={cumulativePct} />
                      <span
                        style={{
                          minWidth: 56,
                          textAlign: 'right',
                          fontWeight: 500,
                          color: cumulativePct >= 85 ? '#62b3a8' : 'var(--hy-ink)',
                        }}
                      >
                        {formatPctPtBr(cumulativePct, 1)}%
                      </span>
                    </span>
                  </Td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '48px 0',
                      textAlign: 'center',
                      color: 'var(--hy-ink-dim)',
                      fontSize: 13,
                    }}
                  >
                    {t('dashboard.table.emptyMatch')}
                  </td>
                </tr>
              )}
            </tbody>
            {sorted.length > 0 && (
              <tfoot>
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      padding: '16px 18px',
                      borderTop: '2px solid var(--hy-line)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--hy-ink-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '.12em',
                    }}
                  >
                    {t('dashboard.table.total')}
                  </td>
                  <td
                    style={{
                      padding: '16px 18px',
                      borderTop: '2px solid var(--hy-line)',
                      textAlign: 'right',
                      color: 'var(--hy-teal-bright)',
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    {formatPctPtBr(totalAverage, 1)}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {sorted.length > pageSize && (
          <PaginationBar
            page={safePage}
            totalPages={totalPages}
            startIdx={startIdx}
            endIdx={endIdx}
            total={sorted.length}
            onPage={(p) => setPage(p)}
          />
        )}
      </div>
    </div>
  );
}

interface ThProps {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: SortDir;
  align?: 'left' | 'center' | 'right';
}

function Th({ children, onClick, active, dir, align = 'left' }: ThProps) {
  const sortIndicator = active ? (dir === 'asc' ? '▲' : '▼') : '↕';
  return (
    <th
      scope="col"
      aria-sort={
        active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'
      }
      style={{
        padding: '14px 18px',
        textAlign: align,
        fontSize: 10.5,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '.12em',
        color: 'var(--hy-ink-dim)',
        borderBottom: '1px solid var(--hy-line)',
        background: 'var(--hy-section-bg)',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {children}
        <span
          style={{
            color: active ? '#62b3a8' : 'var(--hy-ink-faint)',
            fontSize: 9,
            transition: 'color .15s ease',
          }}
        >
          {sortIndicator}
        </span>
      </button>
    </th>
  );
}

function Td({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <td
      style={{
        padding: '14px 18px',
        textAlign: align,
        color: 'var(--hy-ink)',
      }}
    >
      {children}
    </td>
  );
}

function SentBadge({
  sent,
  t,
}: {
  sent: boolean;
  t: (k: string) => string;
}) {
  const color = sent ? 'var(--hy-teal-bright)' : 'var(--hy-ink-faint)';
  const bg = sent ? 'rgba(98, 179, 168, 0.12)' : 'var(--hy-track)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: sent ? 600 : 500,
        color,
        background: bg,
        padding: '3px 10px',
        borderRadius: 999,
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: 999, background: color }}
      />
      {sent ? t('dashboard.table.sent') : t('dashboard.table.notSent')}
    </span>
  );
}

function PageSizeSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11.5,
        color: 'var(--hy-ink-dim)',
        textTransform: 'uppercase',
        letterSpacing: '.1em',
      }}
    >
      <span>Mostrar</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="hy-control"
        style={{
          minWidth: 72,
          height: 32,
          padding: '4px 10px',
          fontSize: 12,
        }}
      >
        {PAGE_SIZE_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  startIdx,
  endIdx,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  startIdx: number;
  endIdx: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderTop: '1px solid var(--hy-line)',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--hy-ink-dim)' }}>
        {startIdx}–{endIdx} de {total}
      </span>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <PageBtn disabled={page === 1} onClick={() => onPage(1)} ariaLabel="Primeira página">
          <ChevronsLeft size={14} />
        </PageBtn>
        <PageBtn
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          ariaLabel="Página anterior"
        >
          <ChevronLeft size={14} />
        </PageBtn>
        <span
          style={{
            fontSize: 12,
            color: 'var(--hy-ink)',
            padding: '0 12px',
            minWidth: 80,
            textAlign: 'center',
          }}
        >
          <strong style={{ color: 'var(--hy-teal-bright)' }}>{page}</strong>
          <span style={{ color: 'var(--hy-ink-faint)' }}> / {totalPages}</span>
        </span>
        <PageBtn
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
          ariaLabel="Próxima página"
        >
          <ChevronRight size={14} />
        </PageBtn>
        <PageBtn
          disabled={page === totalPages}
          onClick={() => onPage(totalPages)}
          ariaLabel="Última página"
        >
          <ChevronsRight size={14} />
        </PageBtn>
      </div>
    </div>
  );
}

function PageBtn({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 30,
        height: 30,
        borderRadius: 6,
        border: '1px solid var(--hy-line)',
        background: 'transparent',
        color: disabled ? 'var(--hy-ink-faint)' : 'var(--hy-ink-dim)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
        transition: 'border-color .15s ease, color .15s ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'var(--hy-teal-bright)';
          e.currentTarget.style.color = 'var(--hy-teal-bright)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'var(--hy-line)';
          e.currentTarget.style.color = 'var(--hy-ink-dim)';
        }
      }}
    >
      {children}
    </button>
  );
}
