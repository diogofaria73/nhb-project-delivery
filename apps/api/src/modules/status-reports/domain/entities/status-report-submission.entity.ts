import { BaseEntity } from '@shared/domain/base.entity';
import { StatusReportAttachment } from './status-report-attachment.entity';

export interface SubmissionProps {
  id?: string;
  companyId: string;
  referenceMonth: Date;
  deliveryEmail: string;
  notes?: string | null;
  submittedById: string;
  submittedAt?: Date;
  updatedAt?: Date;
  attachments?: StatusReportAttachment[];
}

export type SubmissionStatus = 'on-time' | 'late';

export class StatusReportSubmission extends BaseEntity {
  private readonly _companyId: string;
  private _referenceMonth: Date;
  private _deliveryEmail: string;
  private _notes: string | null;
  private readonly _submittedById: string;
  private readonly _submittedAt: Date;
  private _attachments: StatusReportAttachment[];

  constructor(props: SubmissionProps) {
    super(props.id);
    this._companyId = props.companyId;
    this._referenceMonth = StatusReportSubmission.normalizeMonth(props.referenceMonth);
    this._deliveryEmail = props.deliveryEmail;
    this._notes = props.notes ?? null;
    this._submittedById = props.submittedById;
    this._submittedAt = props.submittedAt ?? new Date();
    this._attachments = props.attachments ?? [];
  }

  get companyId(): string {
    return this._companyId;
  }
  get referenceMonth(): Date {
    return this._referenceMonth;
  }
  get deliveryEmail(): string {
    return this._deliveryEmail;
  }
  get notes(): string | null {
    return this._notes;
  }
  get submittedById(): string {
    return this._submittedById;
  }
  get submittedAt(): Date {
    return this._submittedAt;
  }
  get attachments(): StatusReportAttachment[] {
    return this._attachments;
  }

  get status(): SubmissionStatus {
    const end = StatusReportSubmission.endOfMonth(this._referenceMonth);
    return this._submittedAt.getTime() <= end.getTime() ? 'on-time' : 'late';
  }

  updateReferenceMonth(month: Date): void {
    this._referenceMonth = StatusReportSubmission.normalizeMonth(month);
    this.touch();
  }

  updateDeliveryEmail(email: string): void {
    this._deliveryEmail = email;
    this.touch();
  }

  updateNotes(notes: string | null): void {
    this._notes = notes;
    this.touch();
  }

  static normalizeMonth(value: Date): Date {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1, 0, 0, 0, 0));
  }

  static endOfMonth(month: Date): Date {
    return new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1, 0, 0, 0, 0) - 1,
    );
  }

  /**
   * Effective deadline for a referenceMonth given a goal's `monthlyDeadlineDay`.
   * Clamps the day to the last day of the month when the day does not exist
   * (e.g., day 31 in February returns Feb 28/29).
   */
  static clampedDeadline(month: Date, deadlineDay: number): Date {
    const lastDay = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const clamped = Math.min(deadlineDay, lastDay);
    return new Date(
      Date.UTC(
        month.getUTCFullYear(),
        month.getUTCMonth(),
        clamped,
        23,
        59,
        59,
        999,
      ),
    );
  }

  /**
   * Classify a submission as on-time/late.
   * When `goalDeadlineDay` is provided, uses the clamped goal deadline (US-06).
   * Otherwise falls back to end-of-month (US-04 BR-30).
   */
  static classify(
    submittedAt: Date,
    referenceMonth: Date,
    goalDeadlineDay?: number,
  ): SubmissionStatus {
    const deadline =
      goalDeadlineDay !== undefined
        ? StatusReportSubmission.clampedDeadline(referenceMonth, goalDeadlineDay)
        : StatusReportSubmission.endOfMonth(referenceMonth);
    return submittedAt.getTime() <= deadline.getTime() ? 'on-time' : 'late';
  }
}
