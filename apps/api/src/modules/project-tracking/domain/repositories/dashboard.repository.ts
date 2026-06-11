import type { ProjectStatus } from '@nhb-status-report/shared';

export const DASHBOARD_REPOSITORY = 'IDashboardRepository';

export interface PortfolioBuckets {
  total: number;
  active: number;
  onHold: number;
  completed: number;
  cancelled: number;
  notStarted: number;
}

export interface WeeklyBarRow {
  isoWeek: number;
  sentCount: number;
  expectedCount: number;
}

export interface DashboardProjectRow {
  snapshotId: string;
  projectId: string;
  projectName: string;
  projectStatus: ProjectStatus;
  pm: string | null;
  responsible: string | null;
  responsibleDetail: string | null;
  notes: string | null;
  weekFlags: Buffer;
  weeksSent: number;
  weeksExpected: number;
  firstActiveWeek: number | null;
  lastSentWeek: number | null;
}

export interface DashboardAggregation {
  portfolio: PortfolioBuckets;
  weeklyBars: WeeklyBarRow[];
  projects: DashboardProjectRow[];
}

export interface PreviousSnapshotForDelta {
  projectId: string;
  projectName: string;
  projectStatus: ProjectStatus;
  weekFlags: Buffer;
}

export interface IDashboardRepository {
  fetchAggregation(
    importId: string,
    currentISOWeek: number,
    weeksInYear: number,
  ): Promise<DashboardAggregation>;
  fetchSnapshotsForDelta(importId: string): Promise<PreviousSnapshotForDelta[]>;
}
