import type { ProjectRowDto, ProjectStatus } from '@nhb-status-report/shared';

const MAX_ISO_WEEKS = 53;

/**
 * Decode the 8-byte base64 bitmap into a length-53 array of booleans (index 0 = week 1).
 */
export function decodeWeekFlags(base64: string): boolean[] {
  const flags = new Array<boolean>(MAX_ISO_WEEKS).fill(false);
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    for (let week = 1; week <= MAX_ISO_WEEKS; week++) {
      const byteIdx = Math.floor((week - 1) / 8);
      const bit = (week - 1) % 8;
      const byte = bytes[byteIdx] ?? 0;
      flags[week - 1] = (byte & (1 << bit)) !== 0;
    }
  } catch {
    // base64 inválido → array de false, comportamento estável
  }
  return flags;
}

/** Cumulative count of weeks marked as sent up to (and including) weekN. */
export function cumulativeWeeksSent(flags: boolean[], weekN: number): number {
  if (weekN <= 0) return 0;
  const limit = Math.min(weekN, flags.length);
  let count = 0;
  for (let i = 0; i < limit; i++) if (flags[i]) count++;
  return count;
}

/**
 * Cumulative percent used by the TABLE: (sent / weekN) * 100 — real value for every project,
 * regardless of status. (BR-67)
 */
export function cumulativePercentForTable(
  flags: boolean[],
  weekN: number,
): number {
  if (weekN <= 0) return 0;
  return (cumulativeWeeksSent(flags, weekN) / weekN) * 100;
}

/**
 * Cumulative percent used by AVERAGES (KPI "Acumulado anual", manager bars):
 * non-ACTIVE projects contribute 0% to the average. (BR-67 + BR-68)
 */
export function cumulativePercentForAverages(
  flags: boolean[],
  weekN: number,
  projectStatus: ProjectStatus,
): number {
  if (projectStatus !== 'ACTIVE') return 0;
  return cumulativePercentForTable(flags, weekN);
}

/** % of visible projects with bit weekN set. (BR-70) */
export function kpiSemanaCorrente(
  visibleProjects: ProjectRowDto[],
  weekN: number,
): number {
  if (visibleProjects.length === 0 || weekN <= 0) return 0;
  let sent = 0;
  for (const p of visibleProjects) {
    const flags = decodeWeekFlags(p.weekFlagsBase64);
    if (flags[weekN - 1]) sent++;
  }
  return (sent / visibleProjects.length) * 100;
}

/** Counts of visible projects by status. (BR-71) */
export function donutCounts(
  visibleProjects: ProjectRowDto[],
): Record<ProjectStatus, number> {
  const map: Record<ProjectStatus, number> = {
    ACTIVE: 0,
    ON_HOLD: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    NOT_STARTED: 0,
  };
  for (const p of visibleProjects) map[p.projectStatus]++;
  return map;
}

/** Weekly percent of visible projects with each week's bit set, for weeks 1..untilWeek. (BR-74) */
export function weeklyPercents(
  visibleProjects: ProjectRowDto[],
  untilWeek: number,
): number[] {
  if (untilWeek <= 0 || visibleProjects.length === 0) {
    return new Array(Math.max(0, untilWeek)).fill(0);
  }
  const decoded = visibleProjects.map((p) => decodeWeekFlags(p.weekFlagsBase64));
  const total = visibleProjects.length;
  const result: number[] = new Array(untilWeek).fill(0);
  for (let w = 1; w <= untilWeek; w++) {
    let sent = 0;
    for (const flags of decoded) {
      if (flags[w - 1]) sent++;
    }
    result[w - 1] = (sent / total) * 100;
  }
  return result;
}

/** Like `weeklyPercents` but returns both the count and the percent per week. */
export function weeklyStats(
  visibleProjects: ProjectRowDto[],
  untilWeek: number,
): Array<{ sent: number; total: number; percent: number }> {
  const total = visibleProjects.length;
  if (untilWeek <= 0 || total === 0) {
    return new Array(Math.max(0, untilWeek))
      .fill(null)
      .map(() => ({ sent: 0, total, percent: 0 }));
  }
  const decoded = visibleProjects.map((p) => decodeWeekFlags(p.weekFlagsBase64));
  const result: Array<{ sent: number; total: number; percent: number }> = [];
  for (let w = 1; w <= untilWeek; w++) {
    let sent = 0;
    for (const flags of decoded) {
      if (flags[w - 1]) sent++;
    }
    result.push({ sent, total, percent: (sent / total) * 100 });
  }
  return result;
}

/**
 * Group visible projects by PM, average their cumulative % (with BR-68),
 * omit groups with 0%, sort descending. (BR-73)
 */
export function byManager(
  visibleProjects: ProjectRowDto[],
  weekN: number,
  noPmLabel = 'Sem PM atribuído',
): Array<{ pm: string; percent: number; count: number }> {
  const groups = new Map<string, { sum: number; count: number }>();
  for (const p of visibleProjects) {
    const key = p.pm?.trim() || noPmLabel;
    const flags = decodeWeekFlags(p.weekFlagsBase64);
    const value = cumulativePercentForAverages(flags, weekN, p.projectStatus);
    const entry = groups.get(key) ?? { sum: 0, count: 0 };
    entry.sum += value;
    entry.count += 1;
    groups.set(key, entry);
  }
  const rows: Array<{ pm: string; percent: number; count: number }> = [];
  for (const [pm, { sum, count }] of groups) {
    const avg = count === 0 ? 0 : sum / count;
    if (avg <= 0) continue; // BR-73 omit zero
    rows.push({ pm, percent: avg, count });
  }
  rows.sort((a, b) => b.percent - a.percent || a.pm.localeCompare(b.pm, 'pt'));
  return rows;
}

/** Returns true if any visible project has at least one `ok` flag inside [fromWeek, toWeek]. */
export function hasSubmissionsInRange(
  visibleProjects: ProjectRowDto[],
  fromWeek: number,
  toWeek: number,
): boolean {
  if (visibleProjects.length === 0 || fromWeek > toWeek) return false;
  for (const p of visibleProjects) {
    const flags = decodeWeekFlags(p.weekFlagsBase64);
    for (let w = fromWeek; w <= toWeek; w++) {
      if (flags[w - 1]) return true;
    }
  }
  return false;
}

/** pt-BR percent formatter — returns the bare number (no '%'). */
export function formatPctPtBr(value: number, decimals = 1): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
