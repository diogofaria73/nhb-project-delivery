import { IStatusReportGoalRepository } from '@modules/status-report-goals/domain/repositories/goal.repository';

function formatMonth(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Build a `referenceMonth (YYYY-MM)` → `monthlyDeadlineDay` map by inspecting
 * non-archived goals that cover any of the given referenceMonths.
 *
 * When no goal covers a referenceMonth, that month is absent from the map and
 * the submission status falls back to BR-30 (end of month).
 */
export async function buildGoalDeadlineLookup(
  goalRepository: IStatusReportGoalRepository,
  referenceMonths: Date[],
): Promise<Map<string, number>> {
  const lookup = new Map<string, number>();
  if (referenceMonths.length === 0) return lookup;

  const rows = await goalRepository.findAll();
  const candidates = rows
    .filter((r) => !r.goal.isArchived)
    .map((r) => r.goal);

  for (const refMonth of referenceMonths) {
    const key = formatMonth(refMonth);
    if (lookup.has(key)) continue;
    const goal = candidates.find(
      (g) => refMonth >= g.period.startDate && refMonth <= g.period.endDate,
    );
    if (goal) lookup.set(key, goal.monthlyDeadlineDay);
  }

  return lookup;
}

export function lookupKey(month: Date): string {
  return formatMonth(month);
}
