import { Inject, Injectable } from '@nestjs/common';
import {
  GOAL_REPOSITORY,
  IStatusReportGoalRepository,
} from '../../domain/repositories/goal.repository';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { fetchGoalAggregate } from '../../infrastructure/queries/goal-aggregate.query';
import { GoalListStatusFilter, ListGoalsQueryDto } from '../dtos/list-goals-query.dto';
import { GoalResponseDto, GoalSummary } from '../dtos/goal-response.dto';

@Injectable()
export class ListGoalsUseCase {
  constructor(
    @Inject(GOAL_REPOSITORY)
    private readonly repository: IStatusReportGoalRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: ListGoalsQueryDto): Promise<GoalResponseDto[]> {
    const rows = await this.repository.findAll();
    const filter = query.status ?? GoalListStatusFilter.All;

    const filtered = rows.filter((row) => {
      if (filter === GoalListStatusFilter.Archived) return row.goal.isArchived;
      if (row.goal.isArchived) return false;
      if (filter === GoalListStatusFilter.All) return true;
      return row.goal.status() === filter;
    });

    return Promise.all(
      filtered.map(async (row) => {
        const aggregate = await fetchGoalAggregate(
          this.prisma,
          row.goal.period.startDate,
          row.goal.period.endDate,
          row.goal.monthlyDeadlineDay,
        );
        const expected = row.goal.deliveriesPerPeriod;
        let eligibleCompanies = 0;
        let companiesHit = 0;
        let totalDelivered = 0;
        let totalOnTime = 0;
        for (const r of aggregate) {
          eligibleCompanies += 1;
          totalDelivered += r.delivered;
          totalOnTime += r.on_time;
          if (r.on_time >= expected) companiesHit += 1;
        }
        const summary: GoalSummary = {
          eligibleCompanies,
          companiesHit,
          totalDelivered,
          totalOnTime,
          aggregateHitRate: eligibleCompanies === 0 ? 0 : companiesHit / eligibleCompanies,
        };
        return GoalResponseDto.fromListed(row, summary);
      }),
    );
  }
}
