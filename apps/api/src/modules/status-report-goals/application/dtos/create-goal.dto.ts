import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GoalPeriodType } from '../../domain/value-objects/goal-period.vo';

const PERIOD_TYPES: GoalPeriodType[] = ['QUARTERLY', 'SEMESTRAL', 'ANNUAL'];

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(PERIOD_TYPES)
  periodType!: GoalPeriodType;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  periodIndex?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(366)
  deliveriesPerPeriod!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  monthlyDeadlineDay!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
