import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { AnalyticsRangeDto } from './analytics-range.dto';
import { endOfMonth, formatMonth, parseMonth } from './analytics-shared';
import { fetchMonthlyAggregate } from './aggregate.query';

export type HeatmapStatus = 'on-time' | 'late' | 'missed' | 'inactive';

export interface HeatmapResponse {
  months: string[]; // YYYY-MM
  companies: Array<{
    companyId: string;
    tradeName: string;
    score: number;
    cells: Array<{ month: string; status: HeatmapStatus }>;
  }>;
}

@Injectable()
export class AnalyticsHeatmapUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: AnalyticsRangeDto): Promise<HeatmapResponse> {
    const from = parseMonth(dto.from);
    const to = endOfMonth(parseMonth(dto.to));
    const rows = await fetchMonthlyAggregate(this.prisma, from, to, dto.companyId);

    const monthsSet = new Set<string>();
    const byCompany = new Map<
      string,
      {
        companyId: string;
        tradeName: string;
        expected: number;
        onTime: number;
        cells: Map<string, HeatmapStatus>;
      }
    >();

    for (const row of rows) {
      const monthKey = formatMonth(row.month);
      monthsSet.add(monthKey);
      let entry = byCompany.get(row.company_id);
      if (!entry) {
        entry = {
          companyId: row.company_id,
          tradeName: row.trade_name,
          expected: 0,
          onTime: 0,
          cells: new Map(),
        };
        byCompany.set(row.company_id, entry);
      }
      entry.cells.set(monthKey, row.status as HeatmapStatus);
      if (row.status !== 'inactive') {
        entry.expected += 1;
        if (row.status === 'on-time') entry.onTime += 1;
      }
    }

    const months = Array.from(monthsSet).sort();
    const companies = Array.from(byCompany.values())
      .map((entry) => ({
        companyId: entry.companyId,
        tradeName: entry.tradeName,
        score: entry.expected === 0 ? 1 : entry.onTime / entry.expected,
        cells: months.map((m) => ({
          month: m,
          status: entry.cells.get(m) ?? 'inactive',
        })),
      }))
      .sort((a, b) => a.score - b.score || a.tradeName.localeCompare(b.tradeName));

    return { months, companies };
  }
}
