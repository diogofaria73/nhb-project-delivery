import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { fetchMonthlyAggregate } from './aggregate.query';
import { endOfMonth, parseMonth } from './analytics-shared';
import {
  AnalyticsCompaniesQueryDto,
  ComplianceBand,
} from './analytics-companies-query.dto';

export interface CompanyCompliance {
  companyId: string;
  tradeName: string;
  expected: number;
  onTime: number;
  late: number;
  missed: number;
  score: number; // 0..1, where 1 = 100% on-time
  band: ComplianceBand;
}

function bandFor(score: number, expected: number): ComplianceBand {
  if (expected === 0) return ComplianceBand.Green;
  if (score >= 0.9) return ComplianceBand.Green;
  if (score >= 0.6) return ComplianceBand.Amber;
  return ComplianceBand.Red;
}

@Injectable()
export class AnalyticsCompaniesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: AnalyticsCompaniesQueryDto): Promise<CompanyCompliance[]> {
    const from = parseMonth(dto.from);
    const to = endOfMonth(parseMonth(dto.to));
    const rows = await fetchMonthlyAggregate(this.prisma, from, to, dto.companyId);

    const map = new Map<string, CompanyCompliance>();
    for (const row of rows) {
      let entry = map.get(row.company_id);
      if (!entry) {
        entry = {
          companyId: row.company_id,
          tradeName: row.trade_name,
          expected: 0,
          onTime: 0,
          late: 0,
          missed: 0,
          score: 0,
          band: ComplianceBand.Green,
        };
        map.set(row.company_id, entry);
      }
      if (row.status === 'inactive') continue;
      entry.expected += 1;
      if (row.status === 'on-time') entry.onTime += 1;
      else if (row.status === 'late') entry.late += 1;
      else entry.missed += 1;
    }

    let list = Array.from(map.values()).filter((c) => c.expected > 0);
    for (const company of list) {
      company.score = company.expected === 0 ? 0 : company.onTime / company.expected;
      company.band = bandFor(company.score, company.expected);
    }

    if (dto.band) list = list.filter((c) => c.band === dto.band);
    if (dto.search) {
      const needle = dto.search.toLowerCase();
      list = list.filter((c) => c.tradeName.toLowerCase().includes(needle));
    }

    list.sort((a, b) => a.score - b.score || a.tradeName.localeCompare(b.tradeName));
    return list;
  }
}
