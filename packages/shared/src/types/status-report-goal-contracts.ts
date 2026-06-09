export type PeriodType = 'QUARTERLY' | 'SEMESTRAL' | 'ANNUAL';
export type GoalStatus = 'active' | 'upcoming' | 'concluded';
export type GoalRowStatus = 'hit' | 'at-risk' | 'off-track';
export type GoalListStatusFilter = GoalStatus | 'archived' | 'all';

export interface GoalSummary {
  eligibleCompanies: number;
  companiesHit: number;
  totalDelivered: number;
  totalOnTime: number;
  aggregateHitRate: number; // companiesHit / eligibleCompanies in [0..1]
}

export interface GoalResponse {
  id: string;
  periodType: PeriodType;
  year: number;
  periodIndex: number | null;
  periodLabel: string;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  isArchived: boolean;
  deliveriesPerPeriod: number;
  monthlyDeadlineDay: number;
  notes: string | null;
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  summary?: GoalSummary;
}

export interface GoalBreakdownRow {
  companyId: string;
  tradeName: string;
  delivered: number;
  onTime: number;
  late: number;
  missing: number;
  status: GoalRowStatus;
  projected?: { delivered: number; onTime: number; status: GoalRowStatus };
}

export interface GoalBreakdownResponse {
  goalId: string;
  rows: GoalBreakdownRow[];
  summary: GoalSummary;
}

export interface GoalCreatePayload {
  periodType: PeriodType;
  year: number;
  periodIndex?: number | null;
  deliveriesPerPeriod: number;
  monthlyDeadlineDay: number;
  notes?: string;
}

export interface GoalUpdatePayload {
  deliveriesPerPeriod?: number;
  monthlyDeadlineDay?: number;
  notes?: string | null;
}

export interface ListGoalsParams {
  status?: GoalListStatusFilter;
}
