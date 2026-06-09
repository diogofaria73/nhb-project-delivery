import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GOAL_REPOSITORY,
  IStatusReportGoalRepository,
} from '../../domain/repositories/goal.repository';
import { GoalResponseDto } from '../dtos/goal-response.dto';

@Injectable()
export class ArchiveGoalUseCase {
  constructor(
    @Inject(GOAL_REPOSITORY)
    private readonly repository: IStatusReportGoalRepository,
  ) {}

  async execute(id: string, currentUserId: string): Promise<GoalResponseDto> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Goal not found');

    if (row.goal.isArchived) row.goal.unarchive(currentUserId);
    else row.goal.archive(currentUserId);

    await this.repository.update(row.goal);
    const refreshed = await this.repository.findById(id);
    return GoalResponseDto.fromListed(refreshed!);
  }
}
