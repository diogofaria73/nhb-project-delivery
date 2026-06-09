import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GOAL_REPOSITORY,
  IStatusReportGoalRepository,
} from '../../domain/repositories/goal.repository';
import { UpdateGoalDto } from '../dtos/update-goal.dto';
import { GoalResponseDto } from '../dtos/goal-response.dto';

@Injectable()
export class UpdateGoalUseCase {
  constructor(
    @Inject(GOAL_REPOSITORY)
    private readonly repository: IStatusReportGoalRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateGoalDto,
    currentUserId: string,
  ): Promise<GoalResponseDto> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Goal not found');
    const goal = row.goal;
    const status = goal.status();

    // BR-43: Concluded goals only allow note edits.
    if (status === 'concluded') {
      if (dto.deliveriesPerPeriod !== undefined || dto.monthlyDeadlineDay !== undefined) {
        throw new ForbiddenException(
          'Concluded goals only allow note edits — deliveriesPerPeriod and monthlyDeadlineDay are locked',
        );
      }
      if (dto.notes !== undefined) goal.updateNotes(dto.notes ?? null, currentUserId);
    } else {
      if (dto.deliveriesPerPeriod !== undefined) {
        goal.updateDeliveriesPerPeriod(dto.deliveriesPerPeriod, currentUserId);
      }
      if (dto.monthlyDeadlineDay !== undefined) {
        goal.updateMonthlyDeadlineDay(dto.monthlyDeadlineDay, currentUserId);
      }
      if (dto.notes !== undefined) goal.updateNotes(dto.notes ?? null, currentUserId);
    }

    await this.repository.update(goal);
    const refreshed = await this.repository.findById(id);
    return GoalResponseDto.fromListed(refreshed!);
  }
}
