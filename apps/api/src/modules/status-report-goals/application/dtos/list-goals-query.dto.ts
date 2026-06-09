import { IsEnum, IsOptional } from 'class-validator';

export enum GoalListStatusFilter {
  Active = 'active',
  Upcoming = 'upcoming',
  Concluded = 'concluded',
  Archived = 'archived',
  All = 'all',
}

export class ListGoalsQueryDto {
  @IsOptional()
  @IsEnum(GoalListStatusFilter)
  status?: GoalListStatusFilter;
}
