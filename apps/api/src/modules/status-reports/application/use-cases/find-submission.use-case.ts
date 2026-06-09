import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GOAL_REPOSITORY,
  IStatusReportGoalRepository,
} from '@modules/status-report-goals/domain/repositories/goal.repository';
import {
  IStatusReportRepository,
  STATUS_REPORT_REPOSITORY,
} from '../../domain/repositories/status-report.repository';
import { SubmissionResponseDto } from '../dtos/submission-response.dto';
import { buildGoalDeadlineLookup, lookupKey } from '../helpers/goal-deadline.helper';

@Injectable()
export class FindSubmissionUseCase {
  constructor(
    @Inject(STATUS_REPORT_REPOSITORY)
    private readonly repository: IStatusReportRepository,
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IStatusReportGoalRepository,
  ) {}

  async execute(id: string): Promise<SubmissionResponseDto> {
    const listed = await this.repository.findById(id);
    if (!listed) {
      throw new NotFoundException('Submission not found');
    }
    const lookup = await buildGoalDeadlineLookup(this.goalRepository, [
      listed.submission.referenceMonth,
    ]);
    return SubmissionResponseDto.fromListed(
      listed,
      lookup.get(lookupKey(listed.submission.referenceMonth)),
    );
  }
}
