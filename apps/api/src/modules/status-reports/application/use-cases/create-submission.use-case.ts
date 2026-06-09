import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  COMPANY_REPOSITORY,
  ICompanyRepository,
} from '@modules/companies/domain/repositories/company.repository';
import {
  GOAL_REPOSITORY,
  IStatusReportGoalRepository,
} from '@modules/status-report-goals/domain/repositories/goal.repository';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
} from '@shared/infrastructure/storage/storage.interface';
import {
  IStatusReportRepository,
  STATUS_REPORT_REPOSITORY,
} from '../../domain/repositories/status-report.repository';
import { StatusReportSubmission } from '../../domain/entities/status-report-submission.entity';
import { StatusReportAttachment } from '../../domain/entities/status-report-attachment.entity';
import { CreateSubmissionDto } from '../dtos/create-submission.dto';
import { SubmissionResponseDto } from '../dtos/submission-response.dto';
import { buildGoalDeadlineLookup, lookupKey } from '../helpers/goal-deadline.helper';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/csv',
  'image/png',
  'image/jpeg',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class CreateSubmissionUseCase {
  constructor(
    @Inject(STATUS_REPORT_REPOSITORY)
    private readonly repository: IStatusReportRepository,
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IStatusReportGoalRepository,
  ) {}

  async execute(
    dto: CreateSubmissionDto,
    files: UploadedFile[],
    submittedById: string,
  ): Promise<SubmissionResponseDto> {
    const company = await this.companyRepository.findById(dto.companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    if (!company.isActive) {
      throw new ConflictException('Cannot register a submission for an inactive company');
    }

    const referenceMonth = this.parseReferenceMonth(dto.referenceMonth);

    let total = 0;
    for (const file of files) {
      if (!ALLOWED_MIME.has(file.mimetype)) {
        throw new BadRequestException(`File type not allowed: ${file.mimetype}`);
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(`File ${file.originalname} exceeds 25 MB`);
      }
      total += file.size;
    }
    if (total > MAX_TOTAL_SIZE) {
      throw new BadRequestException('Total attachments exceed 50 MB');
    }

    const submission = new StatusReportSubmission({
      companyId: dto.companyId,
      referenceMonth,
      deliveryEmail: dto.deliveryEmail,
      notes: dto.notes ?? null,
      submittedById,
    });

    // Persist files first; if anything fails, clean up.
    const storedKeys: string[] = [];
    try {
      for (const file of files) {
        const stored = await this.storage.save(file.buffer, file.originalname, file.mimetype);
        storedKeys.push(stored.storageKey);
        submission.attachments.push(
          new StatusReportAttachment({
            submissionId: submission.id,
            filename: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            storageKey: stored.storageKey,
          }),
        );
      }

      const created = await this.repository.create(submission);
      const listed = await this.repository.findById(created.id);
      const lookup = await buildGoalDeadlineLookup(this.goalRepository, [
        listed!.submission.referenceMonth,
      ]);
      return SubmissionResponseDto.fromListed(
        listed!,
        lookup.get(lookupKey(listed!.submission.referenceMonth)),
      );
    } catch (err) {
      await Promise.allSettled(storedKeys.map((k) => this.storage.delete(k)));
      throw err;
    }
  }

  private parseReferenceMonth(raw: string): Date {
    const [yearStr, monthStr] = raw.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1; // JS months are 0-based
    const candidate = new Date(Date.UTC(year, month, 1));
    const now = new Date();
    const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    if (candidate.getTime() > currentMonth.getTime()) {
      throw new BadRequestException('Reference month cannot be in the future');
    }
    return candidate;
  }
}
