export type GoalRowStatus = 'hit' | 'at-risk' | 'off-track';

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
  summary: {
    eligibleCompanies: number;
    companiesHit: number;
    totalDelivered: number;
    totalOnTime: number;
    aggregateHitRate: number;
  };
}
