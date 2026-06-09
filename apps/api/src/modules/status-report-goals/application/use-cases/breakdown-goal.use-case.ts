import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import {
  GOAL_REPOSITORY,
  IStatusReportGoalRepository,
} from '../../domain/repositories/goal.repository';
import { fetchGoalAggregate } from '../../infrastructure/queries/goal-aggregate.query';
import {
  GoalBreakdownResponse,
  GoalBreakdownRow,
  GoalRowStatus,
} from '../dtos/goal-breakdown-response.dto';

@Injectable()
export class BreakdownGoalUseCase {
  constructor(
    @Inject(GOAL_REPOSITORY)
    private readonly repository: IStatusReportGoalRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, project: boolean): Promise<GoalBreakdownResponse> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Goal not found');
    const goal = row.goal;
    const expected = goal.deliveriesPerPeriod;

    const aggregate = await fetchGoalAggregate(
      this.prisma,
      goal.period.startDate,
      goal.period.endDate,
      goal.monthlyDeadlineDay,
    );

    const monthsTotal = goal.period.monthsInPeriod();
    const monthsElapsed = this.computeMonthsElapsed(goal.period.startDate, goal.period.endDate);
    const shouldProject = project && goal.status() === 'active' && monthsElapsed > 0;

    let eligibleCompanies = 0;
    let companiesHit = 0;
    let totalDelivered = 0;
    let totalOnTime = 0;
    const rows: GoalBreakdownRow[] = [];

    for (const r of aggregate) {
      eligibleCompanies += 1;
      const delivered = r.delivered;
      const onTime = r.on_time;
      const late = delivered - onTime;
      const missing = Math.max(0, expected - delivered);
      const status = this.classify(delivered, onTime, expected);

      let projected: GoalBreakdownRow['projected'];
      if (shouldProject) {
        const factor = monthsTotal / monthsElapsed;
        const projectedDelivered = Math.round(delivered * factor);
        const projectedOnTime = Math.round(onTime * factor);
        projected = {
          delivered: projectedDelivered,
          onTime: projectedOnTime,
          status: this.classify(projectedDelivered, projectedOnTime, expected),
        };
      }

      totalDelivered += delivered;
      totalOnTime += onTime;
      if (onTime >= expected) companiesHit += 1;

      rows.push({
        companyId: r.company_id,
        tradeName: r.trade_name,
        delivered,
        onTime,
        late,
        missing,
        status,
        ...(projected ? { projected } : {}),
      });
    }

    const statusRank: Record<GoalRowStatus, number> = {
      'off-track': 0,
      'at-risk': 1,
      hit: 2,
    };
    rows.sort(
      (a, b) =>
        statusRank[a.status] - statusRank[b.status] ||
        a.tradeName.localeCompare(b.tradeName),
    );

    return {
      goalId: goal.id,
      rows,
      summary: {
        eligibleCompanies,
        companiesHit,
        totalDelivered,
        totalOnTime,
        aggregateHitRate: eligibleCompanies === 0 ? 0 : companiesHit / eligibleCompanies,
      },
    };
  }

  private classify(delivered: number, onTime: number, expected: number): GoalRowStatus {
    if (onTime >= expected) return 'hit';
    if (delivered >= expected) return 'at-risk';
    return 'off-track';
  }

  private computeMonthsElapsed(start: Date, end: Date): number {
    const today = new Date();
    const horizon = today < end ? today : end;
    return (
      (horizon.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (horizon.getUTCMonth() - start.getUTCMonth()) +
      1
    );
  }
}
