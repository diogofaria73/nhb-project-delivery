import { Inject, Injectable } from '@nestjs/common';
import {
  GOAL_REPOSITORY,
  IStatusReportGoalRepository,
} from '@modules/status-report-goals/domain/repositories/goal.repository';
import {
  IStatusReportRepository,
  STATUS_REPORT_REPOSITORY,
} from '../../domain/repositories/status-report.repository';
import { StatusReportSubmission } from '../../domain/entities/status-report-submission.entity';
import {
  SubmissionsSummaryQueryDto,
  SubmissionsSummaryResponse,
} from '../dtos/submissions-summary-query.dto';
import { buildGoalDeadlineLookup, lookupKey } from '../helpers/goal-deadline.helper';

function parseMonth(raw: string): Date {
  const [yearStr, monthStr] = raw.split('-');
  return new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1));
}

function endOfMonth(month: Date): Date {
  return new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1, 0, 0, 0, 0) - 1,
  );
}

@Injectable()
export class GetSubmissionsSummaryUseCase {
  constructor(
    @Inject(STATUS_REPORT_REPOSITORY)
    private readonly repository: IStatusReportRepository,
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IStatusReportGoalRepository,
  ) {}

  async execute(query: SubmissionsSummaryQueryDto): Promise<SubmissionsSummaryResponse> {
    const from = parseMonth(query.from);
    const to = endOfMonth(parseMonth(query.to));

    const rows = await this.repository.findAllForSummary({
      companyId: query.companyId,
      from,
      to,
    });

    if (rows.length === 0) {
      return { delivered: 0, onTime: 0, late: 0 };
    }

    const months = rows.map((r) => r.referenceMonth);
    const deadlineLookup = await buildGoalDeadlineLookup(this.goalRepository, months);

    let onTime = 0;
    let late = 0;
    for (const r of rows) {
      const deadlineDay = deadlineLookup.get(lookupKey(r.referenceMonth));
      const status = StatusReportSubmission.classify(
        r.submittedAt,
        r.referenceMonth,
        deadlineDay,
      );
      if (status === 'on-time') onTime += 1;
      else late += 1;
    }

    return { delivered: rows.length, onTime, late };
  }
}
