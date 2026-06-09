import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  GOAL_REPOSITORY,
  IStatusReportGoalRepository,
} from '../../domain/repositories/goal.repository';
import { GoalPeriod } from '../../domain/value-objects/goal-period.vo';
import { StatusReportGoal } from '../../domain/entities/status-report-goal.entity';
import { CreateGoalDto } from '../dtos/create-goal.dto';
import { GoalResponseDto } from '../dtos/goal-response.dto';

@Injectable()
export class CreateGoalUseCase {
  constructor(
    @Inject(GOAL_REPOSITORY)
    private readonly repository: IStatusReportGoalRepository,
  ) {}

  async execute(dto: CreateGoalDto, currentUserId: string): Promise<GoalResponseDto> {
    const period = GoalPeriod.create({
      type: dto.periodType,
      year: dto.year,
      index: dto.periodIndex ?? null,
    });

    const existing = await this.repository.findByPeriod(period.type, period.year, period.index);
    if (existing) {
      throw new ConflictException('A goal for this period already exists');
    }

    const goal = new StatusReportGoal({
      period,
      deliveriesPerPeriod: dto.deliveriesPerPeriod,
      monthlyDeadlineDay: dto.monthlyDeadlineDay,
      notes: dto.notes ?? null,
      createdById: currentUserId,
    });

    const created = await this.repository.create(goal);
    const listed = await this.repository.findById(created.id);
    return GoalResponseDto.fromListed(listed!);
  }
}
