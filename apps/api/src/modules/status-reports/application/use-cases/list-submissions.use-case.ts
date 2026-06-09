import { Inject, Injectable } from '@nestjs/common';
import {
  GOAL_REPOSITORY,
  IStatusReportGoalRepository,
} from '@modules/status-report-goals/domain/repositories/goal.repository';
import {
  IStatusReportRepository,
  PaginatedResult,
  STATUS_REPORT_REPOSITORY,
} from '../../domain/repositories/status-report.repository';
import { ListSubmissionsQueryDto } from '../dtos/list-submissions-query.dto';
import { SubmissionResponseDto } from '../dtos/submission-response.dto';
import { buildGoalDeadlineLookup, lookupKey } from '../helpers/goal-deadline.helper';

@Injectable()
export class ListSubmissionsUseCase {
  constructor(
    @Inject(STATUS_REPORT_REPOSITORY)
    private readonly repository: IStatusReportRepository,
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IStatusReportGoalRepository,
  ) {}

  async execute(
    query: ListSubmissionsQueryDto,
  ): Promise<PaginatedResult<SubmissionResponseDto>> {
    const result = await this.repository.findAll(
      {
        companyId: query.companyId,
        status: query.status,
        from: query.from ? this.parseMonth(query.from) : undefined,
        to: query.to ? this.parseMonth(query.to) : undefined,
        search: query.search,
        submittedById: query.submittedById,
      },
      { page: query.page ?? 1, limit: query.limit ?? 20 },
    );

    const months = result.data.map((l) => l.submission.referenceMonth);
    const deadlineLookup = await buildGoalDeadlineLookup(this.goalRepository, months);

    return {
      data: result.data.map((l) =>
        SubmissionResponseDto.fromListed(
          l,
          deadlineLookup.get(lookupKey(l.submission.referenceMonth)),
        ),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  private parseMonth(raw: string): Date {
    const [yearStr, monthStr] = raw.split('-');
    return new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1));
  }
}
