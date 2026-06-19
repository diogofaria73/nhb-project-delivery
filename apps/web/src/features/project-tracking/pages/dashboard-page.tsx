import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarX2, Upload } from 'lucide-react';
import type { ProjectRowDto } from '@nhb-status-report/shared';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useDashboard } from '../hooks/use-dashboard';
import { useDashboardFilters } from '../hooks/use-dashboard-filters';
import {
  isoWeekRange,
  lastIsoWeekOfMonth,
  monthIndexOfIsoWeek,
  weeksInYear as weeksInYearFn,
} from '../lib/iso-week';
import {
  donutCounts,
  hasSubmissionsInRange,
  kpiSemanaCorrente,
  byManager,
  weeklyStats,
} from '../lib/compute';
import { HydroThemeScope } from '../components/hydro/hydro-theme-scope';
import { BulletKpi } from '../components/hydro/bullet-kpi';
import { StatusDonut } from '../components/hydro/status-donut';
import { ManagerBars } from '../components/hydro/manager-bars';
import { WeeklyBars } from '../components/hydro/weekly-bars';
import { ProjectDetailTable } from '../components/hydro/project-detail-table';
import { StatusMultiSelect } from '../components/hydro/status-multi-select';
import { InfoTooltip } from '../components/hydro/info-tooltip';
import { ImportDialog } from '../components/import-dialog';

export function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const { data, loading, refetch } = useDashboard(selectedYear);
  const referenceYear = data?.referenceYear ?? selectedYear;
  const totalWeeks = weeksInYearFn(referenceYear);
  const initialWeek = data?.currentWeek.isoWeek ?? 1;
  const isReady = !!data;

  return (
    <HydroThemeScope>
      <div className="hy-container">
        {!isReady && !loading ? (
          <EmptyShell year={referenceYear} />
        ) : !data ? (
          <DashboardSkeleton />
        ) : (
          <DashboardContent
            key={selectedYear}
            data={data}
            referenceYear={referenceYear}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            initialWeek={initialWeek}
            totalWeeks={totalWeeks}
            onImported={refetch}
          />
        )}
      </div>
    </HydroThemeScope>
  );
}

interface DashboardContentProps {
  data: NonNullable<ReturnType<typeof useDashboard>['data']>;
  referenceYear: number;
  selectedYear: number;
  onYearChange: (year: number) => void;
  initialWeek: number;
  totalWeeks: number;
  onImported: () => void;
}

function DashboardContent({
  data,
  referenceYear,
  selectedYear,
  onYearChange,
  initialWeek,
  onImported,
}: DashboardContentProps) {
  const { t } = useTranslation();
  const { role } = useCurrentUser();
  const isAdmin = role === 'ADMINISTRATOR';
  const [importOpen, setImportOpen] = useState(false);

  const filters = useDashboardFilters({ initialWeek, referenceYear });

  const allProjects: ProjectRowDto[] = data.projects;

  const visibleProjects = useMemo(
    () => allProjects.filter((p) => filters.selectedStatuses.has(p.projectStatus)),
    [allProjects, filters.selectedStatuses],
  );

  const tableProjects = useMemo(
    () =>
      filters.donutFocus
        ? visibleProjects.filter((p) => p.projectStatus === filters.donutFocus)
        : visibleProjects,
    [visibleProjects, filters.donutFocus],
  );

  const acumuladoAnual = data.annualConsolidated.percent ?? 0;

  const semanaCorrente = useMemo(
    () => kpiSemanaCorrente(visibleProjects, filters.weekN),
    [visibleProjects, filters.weekN],
  );

  const counts = useMemo(() => donutCounts(visibleProjects), [visibleProjects]);

  const managerRows = useMemo(
    () => byManager(visibleProjects, filters.weekN, t('dashboard.manager.noPm')),
    [visibleProjects, filters.weekN, t],
  );

  const weeklyData = useMemo(
    () => weeklyStats(visibleProjects, filters.weekN),
    [visibleProjects, filters.weekN],
  );

  const monthRange = useMemo(() => {
    if (filters.monthFilter === null) {
      return { from: 1, to: filters.weeksInYear };
    }
    let from = 1;
    for (let w = 1; w <= filters.weeksInYear; w++) {
      if (monthIndexOfIsoWeek(referenceYear, w) === filters.monthFilter) {
        from = w;
        break;
      }
    }
    const to = lastIsoWeekOfMonth(referenceYear, filters.monthFilter);
    return { from, to };
  }, [filters.monthFilter, filters.weeksInYear, referenceYear]);

  const periodHasData = useMemo(
    () =>
      hasSubmissionsInRange(visibleProjects, monthRange.from, monthRange.to),
    [visibleProjects, monthRange],
  );

  const showEmptyPeriodBanner =
    filters.monthFilter !== null && !periodHasData && visibleProjects.length > 0;

  const isEmpty = !data.hasActiveImport;

  return (
    <>
      <TopBar
        filters={filters}
        referenceYear={referenceYear}
        selectedYear={selectedYear}
        onYearChange={onYearChange}
        isAdmin={isAdmin}
        onImport={() => setImportOpen(true)}
      />

      {isEmpty ? (
        <EmptyState
          year={referenceYear}
          isAdmin={isAdmin}
          onImport={() => setImportOpen(true)}
        />
      ) : (
        <>
          {showEmptyPeriodBanner && (
            <EmptyPeriodBanner
              monthIndex={filters.monthFilter!}
              onClear={() => filters.setMonthFilter(null)}
            />
          )}
          <SectionHeading
            kicker="01"
            title={t('dashboard.sections.snapshot')}
            description={t('dashboard.sections.snapshotHint')}
          />

          <div
            className="hy-grid-12"
            style={{ gridTemplateColumns: '2fr 1.25fr' }}
          >
            <Panel title={t('dashboard.kpis.panelTitle')}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 44,
                }}
              >
                <BulletKpi
                  label={t('dashboard.kpis.acumuladoAnualLabel')}
                  hint={t('dashboard.kpis.acumuladoAnualHint')}
                  value={acumuladoAnual}
                  info={
                    <InfoTooltip
                      title={t('dashboard.kpis.acumuladoAnualLabel')}
                      formula={t('dashboard.info.acumuladoAnual.formula')}
                      description={t('dashboard.info.acumuladoAnual.description')}
                    />
                  }
                />
                <BulletKpi
                  label={t('dashboard.kpis.semanaCorrenteLabel')}
                  hint={t('dashboard.kpis.semanaCorrenteHint', {
                    w: filters.weekN,
                  })}
                  value={semanaCorrente}
                  info={
                    <InfoTooltip
                      title={t('dashboard.kpis.semanaCorrenteLabel')}
                      formula={t('dashboard.info.semanaCorrente.formula')}
                      description={t('dashboard.info.semanaCorrente.description')}
                    />
                  }
                />
              </div>
            </Panel>

            <Panel
              title={t('dashboard.donut.panelTitle')}
              info={
                <InfoTooltip
                  title={t('dashboard.donut.panelTitle')}
                  formula={t('dashboard.info.donut.formula')}
                  description={t('dashboard.info.donut.description')}
                />
              }
            >
              <StatusDonut
                counts={counts}
                focus={filters.donutFocus}
                onSelect={(s) => filters.setDonutFocus(s)}
              />
            </Panel>
          </div>

          <SectionHeading
            kicker="02"
            title={t('dashboard.sections.trend')}
            description={t('dashboard.sections.trendHint')}
          />

          <div
            className="hy-grid-12"
            style={{ gridTemplateColumns: '1fr 1.3fr' }}
          >
            <Panel
              title={t('dashboard.manager.panelTitle')}
              subtitle={t('dashboard.manager.subtitle')}
              info={
                <InfoTooltip
                  title={t('dashboard.manager.panelTitle')}
                  formula={t('dashboard.info.manager.formula')}
                  description={t('dashboard.info.manager.description')}
                />
              }
            >
              <ManagerBars rows={managerRows} />
            </Panel>
            <Panel
              title={t('dashboard.weekly.panelTitle')}
              subtitle={t('dashboard.weekly.subtitle', { w: filters.weekN })}
              info={
                <InfoTooltip
                  title={t('dashboard.weekly.panelTitle')}
                  formula={t('dashboard.info.weekly.formula')}
                  description={t('dashboard.info.weekly.description')}
                />
              }
            >
              <WeeklyBars
                stats={weeklyData}
                selectedWeek={filters.weekN}
                referenceYear={referenceYear}
              />
            </Panel>
          </div>

          <SectionHeading
            kicker="03"
            title={t('dashboard.sections.detail')}
            description={t('dashboard.sections.detailHint')}
          />

          <ProjectDetailTable
            projects={tableProjects}
            totalVisible={visibleProjects.length}
            weekN={filters.weekN}
            donutFocus={filters.donutFocus}
            onClearDonutFocus={() =>
              filters.donutFocus && filters.setDonutFocus(filters.donutFocus)
            }
          />
        </>
      )}

      {isAdmin && (
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          initialYear={referenceYear}
          onImported={onImported}
        />
      )}
    </>
  );
}

function TopBar({
  filters,
  referenceYear,
  selectedYear,
  onYearChange,
  isAdmin,
  onImport,
}: {
  filters: ReturnType<typeof useDashboardFilters>;
  referenceYear: number;
  selectedYear: number;
  onYearChange: (year: number) => void;
  isAdmin: boolean;
  onImport: () => void;
}) {
  const { t } = useTranslation();
  const totalWeeks = filters.weeksInYear;
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear + 1; y >= currentYear - 3; y--) yearOptions.push(y);

  const weekOptions: number[] = [];
  for (let w = 1; w <= totalWeeks; w++) {
    if (
      filters.monthFilter === null ||
      monthIndexOfIsoWeek(referenceYear, w) === filters.monthFilter
    ) {
      weekOptions.push(w);
    }
  }

  function formatWeekLabel(week: number): string {
    const { weekStart, weekEnd } = isoWeekRange(referenceYear, week);
    const day = (d: Date) =>
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${t('dashboard.filters.weekN', { n: week })} (${day(weekStart)} – ${day(weekEnd)})`;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        paddingBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '.18em',
              color: 'var(--hy-teal-bright)',
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            {referenceYear} · {t('dashboard.subtitle')}
          </div>
          <h1
            className="hy-display"
            style={{
              fontSize: 38,
              margin: 0,
              lineHeight: 1.05,
              color: 'var(--hy-ink)',
              letterSpacing: '-0.01em',
            }}
          >
            {t('dashboard.title')}
          </h1>
        </div>

        <div
          style={{
            width: 130,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            opacity: 0.95,
          }}
        >
          <BrandLogo />
        </div>
      </div>

      <div
        className="hy-fade-up"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 14,
          flexWrap: 'wrap',
          padding: '20px 22px',
          background: 'var(--hy-section-bg)',
          border: '1px solid var(--hy-line)',
          borderRadius: 12,
          backdropFilter: 'blur(8px)',
          animationDelay: '0.08s',
        }}
      >
        <FilterField label={t('dashboard.filters.year')}>
          <select
            className="hy-control"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            style={{ minWidth: 110 }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label={t('dashboard.filters.status')}>
          <StatusMultiSelect
            selected={filters.selectedStatuses}
            onToggle={filters.toggleStatus}
            onSelectAll={filters.selectAllStatuses}
            onClearAll={() => {}}
          />
        </FilterField>

        <FilterField label={t('dashboard.filters.month')}>
          <select
            className="hy-control"
            value={filters.monthFilter ?? -1}
            onChange={(e) => {
              const v = Number(e.target.value);
              filters.setMonthFilter(v === -1 ? null : v);
            }}
          >
            <option value={-1}>{t('dashboard.filters.monthAll')}</option>
            {Array.from({ length: 12 }).map((_, m) => (
              <option key={m} value={m}>
                {t(`dashboard.months.${m}`)}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label={t('dashboard.filters.week')}>
          <select
            className="hy-control"
            value={filters.monthFilter === null ? '' : filters.weekN}
            onChange={(e) => filters.setWeek(Number(e.target.value))}
            disabled={filters.monthFilter === null}
            title={
              filters.monthFilter === null
                ? t('dashboard.filters.weekDisabledHint')
                : undefined
            }
            style={{
              minWidth: 220,
              opacity: filters.monthFilter === null ? 0.55 : 1,
              cursor:
                filters.monthFilter === null ? 'not-allowed' : 'pointer',
            }}
          >
            {filters.monthFilter === null ? (
              <option value="">{t('dashboard.filters.weekAllYear')}</option>
            ) : (
              weekOptions.map((w) => (
                <option key={w} value={w}>
                  {formatWeekLabel(w)}
                </option>
              ))
            )}
          </select>
        </FilterField>

        <div style={{ flex: 1 }} />

        {isAdmin && (
          <button
            type="button"
            className="hy-control"
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--hy-teal)',
              border: '1px solid var(--hy-teal-bright)',
              color: '#1b2027',
              fontWeight: 600,
            }}
            onClick={onImport}
          >
            <Upload size={14} />
            {t('dashboard.importNow')}
          </button>
        )}
      </div>
    </div>
  );
}

function BrandLogo() {
  return (
    <span
      className="hy-display"
      style={{
        fontSize: 22,
        letterSpacing: '.22em',
        color: 'var(--hy-ink)',
        fontWeight: 400,
      }}
    >
      HYDRO
    </span>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="hy-label">{label}</span>
      {children}
    </div>
  );
}

function EmptyPeriodBanner({
  monthIndex,
  onClear,
}: {
  monthIndex: number;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const monthName = t(`dashboard.months.${monthIndex}`);
  return (
    <div
      className="hy-panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '18px 22px',
        background: 'rgba(207, 106, 85, 0.08)',
        border: '1px solid rgba(207, 106, 85, 0.3)',
      }}
    >
      <CalendarX2
        size={20}
        color="var(--hy-status-not-started)"
        style={{ flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--hy-ink)',
          }}
        >
          {t('dashboard.emptyPeriod.title', { month: monthName })}
        </p>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12.5,
            color: 'var(--hy-ink-dim)',
            lineHeight: 1.45,
          }}
        >
          {t('dashboard.emptyPeriod.hint')}
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="hy-control"
        style={{
          flexShrink: 0,
          cursor: 'pointer',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--hy-teal-bright)',
          minWidth: 'auto',
          padding: '8px 14px',
          height: 36,
        }}
      >
        {t('dashboard.emptyPeriod.action')}
      </button>
    </div>
  );
}

function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="hy-fade-up"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 16,
        marginTop: 12,
        marginBottom: -8,
      }}
    >
      <span
        className="hy-display"
        style={{
          fontSize: 26,
          color: 'rgba(98, 179, 168, 0.35)',
          letterSpacing: '0.06em',
          lineHeight: 1,
        }}
      >
        {kicker}
      </span>
      <div>
        <h2
          style={{
            fontSize: 14,
            margin: 0,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--hy-ink)',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: 12,
            color: 'var(--hy-ink-dim)',
            margin: '4px 0 0',
            letterSpacing: '0.02em',
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  info,
  children,
}: {
  title: string;
  subtitle?: string;
  info?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="hy-panel">
      <div className="hy-panel-header">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div className="hy-panel-title">{title}</div>
          {info}
        </div>
        {subtitle && <div className="hy-panel-subtitle">{subtitle}</div>}
      </div>
      <div className="hy-panel-body">{children}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <SkelBar h={90} />
      <SkelBar h={70} />
      <SkelBar h={260} />
      <SkelBar h={280} />
      <SkelBar h={420} />
    </div>
  );
}

function SkelBar({ h }: { h: number }) {
  return (
    <div
      style={{
        height: h,
        background:
          'linear-gradient(90deg, var(--hy-skeleton-from) 0%, var(--hy-skeleton-to) 50%, var(--hy-skeleton-from) 100%)',
        backgroundSize: '200% 100%',
        borderRadius: 14,
        opacity: 0.7,
        animation: 'hy-shimmer 1.6s ease-in-out infinite',
      }}
    />
  );
}

function EmptyShell({ year }: { year: number }) {
  const { t } = useTranslation();
  return (
    <div
      className="hy-panel"
      style={{ padding: 64, textAlign: 'center', marginTop: 40 }}
    >
      <p className="hy-display" style={{ fontSize: 26, margin: 0 }}>
        {t('dashboard.empty.title', { year })}
      </p>
    </div>
  );
}

function EmptyState({
  year,
  isAdmin,
  onImport,
}: {
  year: number;
  isAdmin: boolean;
  onImport: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="hy-panel"
      style={{ padding: 64, textAlign: 'center', marginTop: 16 }}
    >
      <p
        className="hy-display"
        style={{ fontSize: 28, margin: 0, color: 'var(--hy-ink)' }}
      >
        {t('dashboard.empty.title', { year })}
      </p>
      <p style={{ marginTop: 14, color: 'var(--hy-ink-dim)', fontSize: 14 }}>
        {isAdmin ? '' : t('dashboard.empty.userHint')}
      </p>
      {isAdmin && (
        <button
          type="button"
          onClick={onImport}
          className="hy-control"
          style={{
            marginTop: 24,
            cursor: 'pointer',
            background: 'var(--hy-teal)',
            border: 'none',
            color: '#1b2027',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 22px',
          }}
        >
          <Upload size={14} />
          {t('dashboard.empty.adminCta')}
        </button>
      )}
    </div>
  );
}
