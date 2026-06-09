import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { AnalyticsRangeDto } from './analytics-range.dto';
import {
  endOfMonth,
  formatMonth,
  MonthlyBucket,
  parseMonth,
  previousWindow,
} from './analytics-shared';
import { fetchMonthlyAggregate } from './aggregate.query';

export interface OverviewResponse {
  window: { from: string; to: string };
  kpis: {
    expected: number;
    onTime: number;
    late: number;
    missed: number;
    deltas?: { expected: number; onTime: number; late: number; missed: number };
  };
  monthly: MonthlyBucket[];
}

function summarize(rows: { month: Date; status: string }[]): MonthlyBucket[] {
  const map = new Map<string, MonthlyBucket>();
  for (const row of rows) {
    const key = formatMonth(row.month);
    let bucket = map.get(key);
    if (!bucket) {
      bucket = { month: key, expected: 0, onTime: 0, late: 0, missed: 0 };
      map.set(key, bucket);
    }
    if (row.status === 'inactive') continue;
    bucket.expected += 1;
    if (row.status === 'on-time') bucket.onTime += 1;
    else if (row.status === 'late') bucket.late += 1;
    else if (row.status === 'missed') bucket.missed += 1;
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

@Injectable()
export class AnalyticsOverviewUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: AnalyticsRangeDto): Promise<OverviewResponse> {
    const from = parseMonth(dto.from);
    const to = parseMonth(dto.to);

    const rows = await fetchMonthlyAggregate(this.prisma, from, endOfMonth(to), dto.companyId);
    const monthly = summarize(rows);

    const totals = monthly.reduce(
      (acc, b) => {
        acc.expected += b.expected;
        acc.onTime += b.onTime;
        acc.late += b.late;
        acc.missed += b.missed;
        return acc;
      },
      { expected: 0, onTime: 0, late: 0, missed: 0 },
    );

    const prev = previousWindow(from, to);
    let deltas: OverviewResponse['kpis']['deltas'];
    if (prev.from.getUTCFullYear() > 1970) {
      const prevRows = await fetchMonthlyAggregate(
        this.prisma,
        prev.from,
        endOfMonth(prev.to),
        dto.companyId,
      );
      const prevMonthly = summarize(prevRows);
      const prevTotals = prevMonthly.reduce(
        (acc, b) => {
          acc.expected += b.expected;
          acc.onTime += b.onTime;
          acc.late += b.late;
          acc.missed += b.missed;
          return acc;
        },
        { expected: 0, onTime: 0, late: 0, missed: 0 },
      );
      if (prevTotals.expected > 0) {
        deltas = {
          expected: totals.expected - prevTotals.expected,
          onTime: totals.onTime - prevTotals.onTime,
          late: totals.late - prevTotals.late,
          missed: totals.missed - prevTotals.missed,
        };
      }
    }

    return {
      window: { from: dto.from, to: dto.to },
      kpis: { ...totals, deltas },
      monthly,
    };
  }
}
