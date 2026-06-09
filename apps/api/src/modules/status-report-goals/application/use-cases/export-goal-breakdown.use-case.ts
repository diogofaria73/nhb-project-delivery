import { Injectable } from '@nestjs/common';
import { BreakdownGoalUseCase } from './breakdown-goal.use-case';

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

@Injectable()
export class ExportGoalBreakdownUseCase {
  constructor(private readonly breakdownUseCase: BreakdownGoalUseCase) {}

  async execute(id: string, project: boolean): Promise<string> {
    const data = await this.breakdownUseCase.execute(id, project);
    const header = ['company', 'delivered', 'on_time', 'late', 'missing', 'status'];
    if (project) header.push('projected_delivered', 'projected_on_time', 'projected_status');
    const lines = [header.join(',')];

    for (const r of data.rows) {
      const base = [
        escapeCell(r.tradeName),
        r.delivered,
        r.onTime,
        r.late,
        r.missing,
        r.status,
      ];
      if (project) {
        base.push(
          r.projected ? r.projected.delivered : '',
          r.projected ? r.projected.onTime : '',
          r.projected ? r.projected.status : '',
        );
      }
      lines.push(base.map((v) => escapeCell(v as string | number)).join(','));
    }

    return lines.join('\n');
  }
}
