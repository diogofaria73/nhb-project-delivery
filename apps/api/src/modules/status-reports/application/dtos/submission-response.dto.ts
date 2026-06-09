import {
  StatusReportSubmission,
  SubmissionStatus,
} from '../../domain/entities/status-report-submission.entity';
import { StatusReportAttachment } from '../../domain/entities/status-report-attachment.entity';
import { ListedSubmission } from '../../domain/repositories/status-report.repository';

export class AttachmentResponseDto {
  id!: string;
  filename!: string;
  mimeType!: string;
  sizeBytes!: number;

  static fromEntity(attachment: StatusReportAttachment): AttachmentResponseDto {
    const dto = new AttachmentResponseDto();
    dto.id = attachment.id;
    dto.filename = attachment.filename;
    dto.mimeType = attachment.mimeType;
    dto.sizeBytes = attachment.sizeBytes;
    return dto;
  }
}

interface CompanyRef {
  id: string;
  tradeName: string;
  legalName: string;
  cnpj: string;
}

interface UserRef {
  id: string;
  name: string;
}

export class SubmissionResponseDto {
  id!: string;
  company!: CompanyRef;
  referenceMonth!: string; // YYYY-MM
  deliveryEmail!: string;
  notes!: string | null;
  submittedBy!: UserRef;
  submittedAt!: Date;
  updatedAt!: Date;
  status!: SubmissionStatus;
  attachments!: AttachmentResponseDto[];

  static fromListed(
    listed: ListedSubmission,
    goalDeadlineDay?: number,
  ): SubmissionResponseDto {
    const s = listed.submission;
    const dto = new SubmissionResponseDto();
    dto.id = s.id;
    dto.company = {
      id: s.companyId,
      tradeName: listed.companyTradeName,
      legalName: listed.companyLegalName,
      cnpj: listed.companyCnpj,
    };
    dto.referenceMonth = SubmissionResponseDto.formatMonth(s.referenceMonth);
    dto.deliveryEmail = s.deliveryEmail;
    dto.notes = s.notes;
    dto.submittedBy = { id: s.submittedById, name: listed.submittedByName };
    dto.submittedAt = s.submittedAt;
    dto.updatedAt = s.updatedAt;
    dto.status =
      goalDeadlineDay !== undefined
        ? StatusReportSubmission.classify(s.submittedAt, s.referenceMonth, goalDeadlineDay)
        : s.status;
    dto.attachments = s.attachments.map(AttachmentResponseDto.fromEntity);
    return dto;
  }

  static formatMonth(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
}
