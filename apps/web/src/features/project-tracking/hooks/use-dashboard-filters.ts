import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ProjectStatus } from '@nhb-status-report/shared';
import {
  monthIndexOfIsoWeek,
  weeksInYear as weeksInYearFn,
} from '../lib/iso-week';

const ALL_STATUSES: readonly ProjectStatus[] = [
  'ACTIVE',
  'COMPLETED',
  'ON_HOLD',
  'NOT_STARTED',
  'CANCELLED',
];

export interface UseDashboardFiltersOptions {
  initialWeek: number;
  referenceYear: number;
}

export interface UseDashboardFiltersResult {
  selectedStatuses: Set<ProjectStatus>;
  weekN: number;
  /** Month index (0–11) derived from weekN — useful for charts/labels. */
  monthIndex: number;
  /** Month chosen in the topbar filter; `null` means "all months". */
  monthFilter: number | null;
  donutFocus: ProjectStatus | null;
  weeksInYear: number;
  allStatuses: readonly ProjectStatus[];
  setStatuses: (next: Set<ProjectStatus>) => void;
  toggleStatus: (status: ProjectStatus) => void;
  selectAllStatuses: () => void;
  setWeek: (w: number) => void;
  setMonthFilter: (m: number | null) => void;
  setDonutFocus: (status: ProjectStatus | null) => void;
}

export function useDashboardFilters({
  initialWeek,
  referenceYear,
}: UseDashboardFiltersOptions): UseDashboardFiltersResult {
  const totalWeeks = weeksInYearFn(referenceYear);
  const safeInitialWeek = Math.min(Math.max(initialWeek, 1), totalWeeks);

  const [selectedStatuses, setSelectedStatusesState] = useState<Set<ProjectStatus>>(
    () => new Set(ALL_STATUSES),
  );
  const [weekN, setWeekState] = useState<number>(safeInitialWeek);
  const [monthFilter, setMonthFilterState] = useState<number | null>(null);
  const [donutFocus, setDonutFocusState] = useState<ProjectStatus | null>(null);

  const monthIndex = useMemo(
    () => monthIndexOfIsoWeek(referenceYear, weekN),
    [referenceYear, weekN],
  );

  // BR-72: if the donut focus is no longer in the global selection, clear it.
  useEffect(() => {
    if (donutFocus !== null && !selectedStatuses.has(donutFocus)) {
      setDonutFocusState(null);
    }
  }, [donutFocus, selectedStatuses]);

  const setStatuses = useCallback((next: Set<ProjectStatus>) => {
    if (next.size === 0) return; // BR: minimum 1
    setSelectedStatusesState(new Set(next));
  }, []);

  const toggleStatus = useCallback((status: ProjectStatus) => {
    setSelectedStatusesState((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        if (next.size <= 1) return prev; // BR: minimum 1
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  const selectAllStatuses = useCallback(() => {
    setSelectedStatusesState(new Set(ALL_STATUSES));
  }, []);

  const setWeek = useCallback(
    (w: number) => {
      const clamped = Math.min(Math.max(w, 1), totalWeeks);
      setWeekState(clamped);
    },
    [totalWeeks],
  );

  /**
   * Updates the month filter.
   * - Picking a specific month jumps the selected week to the first ISO week
   *   of that month so the user immediately sees data from the chosen period.
   * - Picking "all months" resets weekN to the initial reference (the system's
   *   current ISO week for the reference year) — the dashboard is then read as
   *   "year-to-date" with today as the cutoff, and the Week select is disabled
   *   in the UI.
   */
  const setMonthFilter = useCallback(
    (m: number | null) => {
      setMonthFilterState(m);
      if (m === null) {
        setWeekState(safeInitialWeek);
        return;
      }
      for (let w = 1; w <= totalWeeks; w++) {
        if (monthIndexOfIsoWeek(referenceYear, w) === m) {
          setWeekState(w);
          return;
        }
      }
    },
    [referenceYear, totalWeeks, safeInitialWeek],
  );

  const setDonutFocus = useCallback((status: ProjectStatus | null) => {
    setDonutFocusState((prev) => (prev === status ? null : status));
  }, []);

  return {
    selectedStatuses,
    weekN,
    monthIndex,
    monthFilter,
    donutFocus,
    weeksInYear: totalWeeks,
    allStatuses: ALL_STATUSES,
    setStatuses,
    toggleStatus,
    selectAllStatuses,
    setWeek,
    setMonthFilter,
    setDonutFocus,
  };
}
