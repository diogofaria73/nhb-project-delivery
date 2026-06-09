import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GOAL_REPOSITORY,
  IStatusReportGoalRepository,
} from '../../domain/repositories/goal.repository';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { fetchGoalAggregate } from '../../infrastructure/queries/goal-aggregate.query';
import { GoalResponseDto, GoalSummary } from '../dtos/goal-response.dto';
import { StatusReportGoal } from '../../domain/entities/status-report-goal.entity';

@Injectable()
export class FindGoalUseCase {
  constructor(
    @Inject(GOAL_REPOSITORY)
    private readonly repository: IStatusReportGoalRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string): Promise<GoalResponseDto> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Goal not found');

    const summary = await this.computeSummary(row.goal);
    return GoalResponseDto.fromListed(row, summary);
  }

  private async computeSummary(goal: StatusReportGoal): Promise<GoalSummary> {
    const aggregate = await fetchGoalAggregate(
      this.prisma,
      goal.period.startDate,
      goal.period.endDate,
      goal.monthlyDeadlineDay,
    );

    const expected = goal.deliveriesPerPeriod;
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
    return {
      eligibleCompanies,
      companiesHit,
      totalDelivered,
      totalOnTime,
      aggregateHitRate: eligibleCompanies === 0 ? 0 : companiesHit / eligibleCompanies,
    };
  }
}
