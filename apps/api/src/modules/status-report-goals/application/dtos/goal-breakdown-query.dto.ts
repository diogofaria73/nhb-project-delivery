import { IsBooleanString, IsOptional } from 'class-validator';

export class GoalBreakdownQueryDto {
  @IsOptional()
  @IsBooleanString()
  project?: string;
}
