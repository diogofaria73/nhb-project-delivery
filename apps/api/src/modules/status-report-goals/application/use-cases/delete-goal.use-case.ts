import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GOAL_REPOSITORY,
  IStatusReportGoalRepository,
} from '../../domain/repositories/goal.repository';

@Injectable()
export class DeleteGoalUseCase {
  constructor(
    @Inject(GOAL_REPOSITORY)
    private readonly repository: IStatusReportGoalRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Goal not found');

    // BR-44: Only Upcoming goals may be deleted hard.
    if (row.goal.status() !== 'upcoming') {
      throw new ForbiddenException(
        'Active or concluded goals cannot be deleted — archive them instead',
      );
    }

    await this.repository.delete(id);
  }
}
