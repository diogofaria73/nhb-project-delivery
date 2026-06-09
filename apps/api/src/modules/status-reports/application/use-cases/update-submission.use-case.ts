import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GOAL_REPOSITORY,
  IStatusReportGoalRepository,
} from '@modules/status-report-goals/domain/repositories/goal.repository';
import {
  IStatusReportRepository,
  STATUS_REPORT_REPOSITORY,
} from '../../domain/repositories/status-report.repository';
import { UpdateSubmissionDto } from '../dtos/update-submission.dto';
import { SubmissionResponseDto } from '../dtos/submission-response.dto';
import { buildGoalDeadlineLookup, lookupKey } from '../helpers/goal-deadline.helper';

@Injectable()
export class UpdateSubmissionUseCase {
  constructor(
    @Inject(STATUS_REPORT_REPOSITORY)
    private readonly repository: IStatusReportRepository,
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IStatusReportGoalRepository,
  ) {}

  async execute(id: string, dto: UpdateSubmissionDto): Promise<SubmissionResponseDto> {
    const listed = await this.repository.findById(id);
    if (!listed) {
      throw new NotFoundException('Submission not found');
    }
    const submission = listed.submission;

    if (dto.referenceMonth !== undefined) {
      const [yearStr, monthStr] = dto.referenceMonth.split('-');
      const candidate = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1));
      const now = new Date();
      const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      if (candidate.getTime() > currentMonth.getTime()) {
        throw new BadRequestException('Reference month cannot be in the future');
      }
      submission.updateReferenceMonth(candidate);
    }
    if (dto.deliveryEmail !== undefined) submission.updateDeliveryEmail(dto.deliveryEmail);
    if (dto.notes !== undefined) submission.updateNotes(dto.notes ?? null);

    await this.repository.update(submission);
    const refreshed = await this.repository.findById(id);
    const lookup = await buildGoalDeadlineLookup(this.goalRepository, [
      refreshed!.submission.referenceMonth,
    ]);
    return SubmissionResponseDto.fromListed(
      refreshed!,
      lookup.get(lookupKey(refreshed!.submission.referenceMonth)),
    );
  }
}
