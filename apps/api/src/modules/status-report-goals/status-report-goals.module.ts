import { Module } from '@nestjs/common';
import { GoalsController } from './presentation/controllers/goals.controller';
import { StatusReportGoalPrismaRepository } from './infrastructure/repositories/goal.prisma-repository';
import { GOAL_REPOSITORY } from './domain/repositories/goal.repository';
import {
  ArchiveGoalUseCase,
  BreakdownGoalUseCase,
  CreateGoalUseCase,
  DeleteGoalUseCase,
  ExportGoalBreakdownUseCase,
  FindGoalUseCase,
  ListGoalsUseCase,
  UpdateGoalUseCase,
} from './application/use-cases';

@Module({
  controllers: [GoalsController],
  providers: [
    {
      provide: GOAL_REPOSITORY,
      useClass: StatusReportGoalPrismaRepository,
    },
    CreateGoalUseCase,
    UpdateGoalUseCase,
    ArchiveGoalUseCase,
    DeleteGoalUseCase,
    FindGoalUseCase,
    ListGoalsUseCase,
    BreakdownGoalUseCase,
    ExportGoalBreakdownUseCase,
  ],
  exports: [GOAL_REPOSITORY],
})
export class StatusReportGoalsModule {}
