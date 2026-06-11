export type ProjectStatus =
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NOT_STARTED';

export type ProjectImportStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'FAILED';

export interface ParseRowError {
  rowNumber: number;
  projectId: string | null;
  reason: string;
}

export interface ParsePreviewRow {
  projectId: string;
  projectName: string;
  projectStatus: ProjectStatus;
  pm: string | null;
  responsible: string | null;
  weeksSent: number;
  weeksExpected: number;
}

export interface BiSanityDiff {
  available: boolean;
  warnings: string[];
}

export interface ParseDeltaStatusChange {
  projectId: string;
  projectName: string;
  from: ProjectStatus;
  to: ProjectStatus;
}

export interface ParseDelta {
  hasPrevious: boolean;
  addedProjects: { projectId: string; projectName: string }[];
  removedProjects: { projectId: string; projectName: string }[];
  statusChanges: ParseDeltaStatusChange[];
  weeklyOksAdded: number[];
  weeklyOksRemoved: number[];
}

export interface ParseReportDto {
  referenceYear: number;
  originalFilename: string;
  fileSizeBytes: number;
  sha256: string;
  totalRowsRead: number;
  rowsAccepted: number;
  rowsSkipped: number;
  rowsRejected: number;
  errors: ParseRowError[];
  errorsTruncated: boolean;
  biSanity: BiSanityDiff;
  delta: ParseDelta;
  preview: ParsePreviewRow[];
}

export interface ProjectImportResponseDto {
  id: string;
  referenceYear: number;
  status: ProjectImportStatus;
  originalFilename: string;
  fileSizeBytes: number;
  sha256: string;
  rowsAccepted: number;
  rowsRejected: number;
  importedById: string;
  importedByName: string;
  importedAt: string;
}

export interface ProjectImportDetailDto extends ProjectImportResponseDto {
  parseReport: ParseReportDto;
}

export interface DashboardHeaderDto {
  importId: string | null;
  importedAt: string | null;
  importedByName: string | null;
  originalFilename: string | null;
  freshness: 'GREEN' | 'AMBER' | 'RED' | null;
  daysSinceImport: number | null;
}

export interface CurrentWeekKpiDto {
  isoWeek: number;
  weekStart: string;
  weekEnd: string;
  activeProjects: number;
  sentThisWeek: number;
  percent: number | null;
}

export interface PortfolioKpiDto {
  totalProjects: number;
  active: number;
  onHold: number;
  completed: number;
  cancelled: number;
  notStarted: number;
}

export interface AnnualConsolidatedKpiDto {
  weeksSent: number;
  weeksExpected: number;
  percent: number | null;
}

export interface WeeklyBarDto {
  isoWeek: number;
  sentCount: number;
  expectedCount: number;
  percent: number | null;
  isFuture: boolean;
  isCurrent: boolean;
}

export interface ProjectRowDto {
  snapshotId: string;
  projectId: string;
  projectName: string;
  projectStatus: ProjectStatus;
  pm: string | null;
  responsible: string | null;
  responsibleDetail: string | null;
  notes: string | null;
  weekFlagsBase64: string;
  weeksSent: number;
  weeksExpected: number;
  compliancePercent: number | null;
  firstActiveWeek: number | null;
  lastSentWeek: number | null;
}

export interface DashboardResponseDto {
  referenceYear: number;
  hasActiveImport: boolean;
  header: DashboardHeaderDto;
  currentWeek: CurrentWeekKpiDto;
  portfolio: PortfolioKpiDto;
  annualConsolidated: AnnualConsolidatedKpiDto;
  weeklyBars: WeeklyBarDto[];
  projects: ProjectRowDto[];
}

export interface ProjectDetailResponseDto extends ProjectRowDto {
  importId: string;
  referenceYear: number;
  weekCells: ProjectWeekCellDto[];
}

export interface ProjectWeekCellDto {
  isoWeek: number;
  weekStart: string;
  weekEnd: string;
  sent: boolean;
  expected: boolean;
}

export interface ImportListParams {
  year?: number;
  status?: ProjectImportStatus;
  page?: number;
  limit?: number;
}

export interface ConfirmImportPayload {
  referenceYear: number;
  expectedSha256: string;
}

export interface PreviewImportPayload {
  referenceYear: number;
}

export interface RestoreImportPayload {
  importId: string;
}
