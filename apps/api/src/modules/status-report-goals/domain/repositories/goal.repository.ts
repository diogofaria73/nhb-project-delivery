import { StatusReportGoal } from '../entities/status-report-goal.entity';
import { GoalPeriodType } from '../value-objects/goal-period.vo';

export const GOAL_REPOSITORY = 'IStatusReportGoalRepository';

export interface GoalListedRow {
  goal: StatusReportGoal;
  createdByName: string;
}

export interface IStatusReportGoalRepository {
  findById(id: string): Promise<GoalListedRow | null>;
  findByPeriod(
    periodType: GoalPeriodType,
    year: number,
    periodIndex: number | null,
  ): Promise<StatusReportGoal | null>;
  findAll(): Promise<GoalListedRow[]>;
  create(goal: StatusReportGoal): Promise<StatusReportGoal>;
  update(goal: StatusReportGoal): Promise<StatusReportGoal>;
  delete(id: string): Promise<void>;
}
