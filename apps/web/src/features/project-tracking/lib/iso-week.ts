import {
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  setISOWeekYear,
  startOfISOWeek,
  endOfISOWeek,
  getMonth,
  addDays,
  startOfYear,
} from 'date-fns';

/** Total ISO weeks in the given calendar year (52 or 53). */
export function weeksInYear(year: number): number {
  // Try Dec 28 — it always lies in the year's last ISO week.
  const dec28 = new Date(year, 11, 28);
  const lastWeek = getISOWeek(dec28);
  return getISOWeekYear(dec28) === year ? lastWeek : 52;
}

/**
 * Last ISO week of the given month within the given calendar year, capped at the year's last ISO week.
 * monthIndex is 0-based (Jan = 0, Dec = 11).
 */
export function lastIsoWeekOfMonth(year: number, monthIndex: number): number {
  // Walk forward to the first day of next month, then take its ISO week, then subtract 1.
  const firstOfNextMonth =
    monthIndex >= 11
      ? new Date(year + 1, 0, 1)
      : new Date(year, monthIndex + 1, 1);
  const lastDayOfMonth = addDays(firstOfNextMonth, -1);
  let week = getISOWeek(lastDayOfMonth);
  const weekYear = getISOWeekYear(lastDayOfMonth);
  // If the last day of December rolls into ISO week 1 of next year (e.g., 2024-12-30), use the year's max.
  if (weekYear !== year) {
    week = weeksInYear(year);
  }
  return Math.min(Math.max(week, 1), weeksInYear(year));
}

/** Month index (0-11) that contains the start of ISO week `weekN` of the given year. */
export function monthIndexOfIsoWeek(year: number, weekN: number): number {
  const max = weeksInYear(year);
  const w = Math.min(Math.max(weekN, 1), max);
  let anchor = startOfISOWeek(new Date(year, 5, 1));
  anchor = setISOWeekYear(anchor, year);
  anchor = setISOWeek(anchor, w);
  return getMonth(anchor);
}

/** Returns { weekStart, weekEnd } for ISO (year, weekN). Used by tooltips and labels. */
export function isoWeekRange(year: number, weekN: number): { weekStart: Date; weekEnd: Date } {
  let anchor = startOfISOWeek(startOfYear(new Date(year, 0, 1)));
  anchor = setISOWeekYear(anchor, year);
  anchor = setISOWeek(anchor, weekN);
  return { weekStart: anchor, weekEnd: endOfISOWeek(anchor) };
}

/** For each week in 1..untilWeek, returns the month index of its start. Used by the month band. */
export function monthAxisForWeeks(year: number, untilWeek: number): number[] {
  const result: number[] = [];
  for (let w = 1; w <= untilWeek; w++) {
    result.push(monthIndexOfIsoWeek(year, w));
  }
  return result;
}
