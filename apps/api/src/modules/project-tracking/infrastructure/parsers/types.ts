import type {
  ProjectStatus,
  ParseRowError,
  ParsePreviewRow,
  BiSanityDiff,
} from '@nhb-status-report/shared';

export interface AcceptedRow {
  rowNumber: number;
  projectId: string;
  projectName: string;
  projectStatus: ProjectStatus;
  responsible: string | null;
  responsibleDetail: string | null;
  pm: string | null;
  notes: string | null;
  weekFlags: Buffer;
  weeksSent: number;
  firstActiveWeek: number | null;
  lastSentWeek: number | null;
}

export interface ParseResult {
  totalRowsRead: number;
  rowsSkipped: number;
  acceptedRows: AcceptedRow[];
  rejectedRows: ParseRowError[];
  errorsTruncated: boolean;
  biSanity: BiSanityDiff;
  preview: ParsePreviewRow[];
}

export const ERROR_CAP = 200;
export const WEEK_FLAG_BYTES = 8;
export const MAX_ISO_WEEKS = 53;
