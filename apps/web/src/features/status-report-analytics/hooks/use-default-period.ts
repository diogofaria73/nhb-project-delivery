export function defaultPeriod(): { from: string; to: string } {
  const now = new Date();
  const toY = now.getUTCFullYear();
  const toM = now.getUTCMonth(); // 0-based
  const fromDate = new Date(Date.UTC(toY, toM - 5, 1));
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  return { from: fmt(fromDate), to: fmt(now) };
}
