import { BadRequestException } from '@nestjs/common';

export type GoalPeriodType = 'QUARTERLY' | 'SEMESTRAL' | 'ANNUAL';

export class GoalPeriod {
  private constructor(
    public readonly type: GoalPeriodType,
    public readonly year: number,
    public readonly index: number | null,
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {}

  static create(props: {
    type: GoalPeriodType;
    year: number;
    index?: number | null;
  }): GoalPeriod {
    const { type, year } = props;
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new BadRequestException('Invalid year');
    }

    let firstMonth = 0;
    let monthsCount = 12;
    let index: number | null = null;

    if (type === 'QUARTERLY') {
      if (props.index === undefined || props.index === null) {
        throw new BadRequestException('Quarter index is required (1-4)');
      }
      if (!Number.isInteger(props.index) || props.index < 1 || props.index > 4) {
        throw new BadRequestException('Quarter index must be between 1 and 4');
      }
      index = props.index;
      firstMonth = (props.index - 1) * 3;
      monthsCount = 3;
    } else if (type === 'SEMESTRAL') {
      if (props.index === undefined || props.index === null) {
        throw new BadRequestException('Semester index is required (1-2)');
      }
      if (!Number.isInteger(props.index) || props.index < 1 || props.index > 2) {
        throw new BadRequestException('Semester index must be 1 or 2');
      }
      index = props.index;
      firstMonth = (props.index - 1) * 6;
      monthsCount = 6;
    } else if (type === 'ANNUAL') {
      index = null;
      firstMonth = 0;
      monthsCount = 12;
    } else {
      throw new BadRequestException('Invalid period type');
    }

    const startDate = new Date(Date.UTC(year, firstMonth, 1));
    const endDate = new Date(Date.UTC(year, firstMonth + monthsCount, 0));
    return new GoalPeriod(type, year, index, startDate, endDate);
  }

  containsDate(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  monthsInPeriod(): number {
    return (
      (this.endDate.getUTCFullYear() - this.startDate.getUTCFullYear()) * 12 +
      (this.endDate.getUTCMonth() - this.startDate.getUTCMonth()) +
      1
    );
  }

  label(): string {
    if (this.type === 'QUARTERLY') return `Q${this.index} ${this.year}`;
    if (this.type === 'SEMESTRAL') return `S${this.index} ${this.year}`;
    return `${this.year}`;
  }
}
