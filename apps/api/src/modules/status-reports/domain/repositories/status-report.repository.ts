import { StatusReportSubmission } from '../entities/status-report-submission.entity';
import { StatusReportAttachment } from '../entities/status-report-attachment.entity';

export type { PaginationOptions, PaginatedResult } from '@shared/domain/pagination.interface';
import type { PaginationOptions, PaginatedResult } from '@shared/domain/pagination.interface';

export interface SubmissionFilters {
  companyId?: string;
  status?: 'on-time' | 'late';
  from?: Date; // first day of starting month (UTC)
  to?: Date;   // first day of ending month (UTC)
  search?: string;
  submittedById?: string;
}

export interface ListedSubmission {
  submission: StatusReportSubmission;
  companyTradeName: string;
  companyLegalName: string;
  companyCnpj: string;
  submittedByName: string;
}

export const STATUS_REPORT_REPOSITORY = 'IStatusReportRepository';

export interface IStatusReportRepository {
  findById(id: string): Promise<ListedSubmission | null>;
  findAttachmentById(submissionId: string, attachmentId: string): Promise<StatusReportAttachment | null>;
  findAll(
    filters: SubmissionFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<ListedSubmission>>;
  /**
   * Non-paginated lookup used by summary aggregations. Returns the raw
   * submission entity plus its referenceMonth so callers can classify each
   * delivery individually.
   */
  findAllForSummary(filters: {
    companyId?: string;
    from?: Date;
    to?: Date;
  }): Promise<Array<{ submittedAt: Date; referenceMonth: Date; companyId: string }>>;
  create(submission: StatusReportSubmission): Promise<StatusReportSubmission>;
  update(submission: StatusReportSubmission): Promise<StatusReportSubmission>;
  delete(submissionId: string): Promise<StatusReportAttachment[]>;
}
