import { GoalStatus } from '../../domain/entities/status-report-goal.entity';
import { GoalListedRow } from '../../domain/repositories/goal.repository';

function formatDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export interface GoalSummary {
  eligibleCompanies: number;
  companiesHit: number;
  totalDelivered: number;
  totalOnTime: number;
  aggregateHitRate: number; // companiesHit / eligibleCompanies, [0..1]
}

export class GoalResponseDto {
  id!: string;
  periodType!: string;
  year!: number;
  periodIndex!: number | null;
  periodLabel!: string;
  startDate!: string;
  endDate!: string;
  status!: GoalStatus;
  isArchived!: boolean;
  deliveriesPerPeriod!: number;
  monthlyDeadlineDay!: number;
  notes!: string | null;
  createdBy!: { id: string; name: string };
  createdAt!: Date;
  updatedAt!: Date;
  summary?: GoalSummary;

  static fromListed(row: GoalListedRow, summary?: GoalSummary): GoalResponseDto {
    const g = row.goal;
    const dto = new GoalResponseDto();
    dto.id = g.id;
    dto.periodType = g.period.type;
    dto.year = g.period.year;
    dto.periodIndex = g.period.index;
    dto.periodLabel = g.period.label();
    dto.startDate = formatDate(g.period.startDate);
    dto.endDate = formatDate(g.period.endDate);
    dto.status = g.status();
    dto.isArchived = g.isArchived;
    dto.deliveriesPerPeriod = g.deliveriesPerPeriod;
    dto.monthlyDeadlineDay = g.monthlyDeadlineDay;
    dto.notes = g.notes;
    dto.createdBy = { id: g.createdById, name: row.createdByName };
    dto.createdAt = g.createdAt;
    dto.updatedAt = g.updatedAt;
    dto.summary = summary;
    return dto;
  }
}
