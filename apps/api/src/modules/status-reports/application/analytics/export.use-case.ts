import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { AnalyticsCompaniesUseCase } from './companies.use-case';
import { AnalyticsExportQueryDto, ExportKind } from './analytics-export-query.dto';
import { endOfMonth, formatMonth, parseMonth } from './analytics-shared';
import { fetchMonthlyAggregate } from './aggregate.query';

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

@Injectable()
export class AnalyticsExportUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companiesUseCase: AnalyticsCompaniesUseCase,
  ) {}

  async execute(dto: AnalyticsExportQueryDto): Promise<string> {
    const kind = dto.kind ?? ExportKind.Flat;
    if (kind === ExportKind.Summary) {
      const data = await this.companiesUseCase.execute({
        from: dto.from,
        to: dto.to,
        companyId: dto.companyId,
      });
      const header = ['company', 'expected', 'on_time', 'late', 'missed', 'score', 'band'];
      const lines = [header.join(',')];
      for (const c of data) {
        lines.push(
          [
            escapeCell(c.tradeName),
            c.expected,
            c.onTime,
            c.late,
            c.missed,
            c.score.toFixed(3),
            c.band,
          ]
            .map((v) => escapeCell(v as string | number))
            .join(','),
        );
      }
      return lines.join('\n');
    }

    // Flat: one row per (company, month) using aggregate, plus delivery details
    // when there is an underlying submission.
    const from = parseMonth(dto.from);
    const to = endOfMonth(parseMonth(dto.to));
    const aggregate = await fetchMonthlyAggregate(this.prisma, from, to, dto.companyId);

    const submissions = await this.prisma.statusReportSubmission.findMany({
      where: {
        referenceMonth: { gte: from, lte: to },
        ...(dto.companyId ? { companyId: dto.companyId } : {}),
      },
      select: {
        companyId: true,
        referenceMonth: true,
        submittedAt: true,
        deliveryEmail: true,
      },
    });
    const submissionByKey = new Map<string, { submittedAt: Date; deliveryEmail: string }>();
    for (const s of submissions) {
      const key = `${s.companyId}|${formatMonth(s.referenceMonth)}`;
      const existing = submissionByKey.get(key);
      if (!existing || s.submittedAt < existing.submittedAt) {
        submissionByKey.set(key, { submittedAt: s.submittedAt, deliveryEmail: s.deliveryEmail });
      }
    }

    const header = ['company', 'reference_month', 'status', 'submitted_at', 'delivery_email'];
    const lines = [header.join(',')];
    for (const row of aggregate) {
      if (row.status === 'inactive') continue;
      const monthKey = formatMonth(row.month);
      const sub = submissionByKey.get(`${row.company_id}|${monthKey}`);
      lines.push(
        [
          escapeCell(row.trade_name),
          escapeCell(monthKey),
          escapeCell(row.status),
          escapeCell(sub ? sub.submittedAt.toISOString() : ''),
          escapeCell(sub ? sub.deliveryEmail : ''),
        ].join(','),
      );
    }
    return lines.join('\n');
  }
}
