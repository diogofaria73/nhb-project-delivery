export function parseMonth(raw: string): Date {
  const [yearStr, monthStr] = raw.split('-');
  return new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1));
}

export function endOfMonth(month: Date): Date {
  return new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1, 0, 0, 0, 0) - 1,
  );
}

export function formatMonth(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function previousWindow(from: Date, to: Date): { from: Date; to: Date } {
  const months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth()) +
    1;
  const newTo = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - 1, 1));
  const newFrom = new Date(Date.UTC(newTo.getUTCFullYear(), newTo.getUTCMonth() - months + 1, 1));
  return { from: newFrom, to: newTo };
}

export type MonthlyBucket = {
  month: string; // YYYY-MM
  expected: number;
  onTime: number;
  late: number;
  missed: number;
};

export interface MonthlyAggregateRow {
  month: Date;
  company_id: string;
  trade_name: string;
  is_eligible: boolean;
  status: 'on-time' | 'late' | 'missed' | 'inactive';
  first_submission_at: Date | null;
}
