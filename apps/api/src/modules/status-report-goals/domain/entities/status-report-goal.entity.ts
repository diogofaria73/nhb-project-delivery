import { BaseEntity } from '@shared/domain/base.entity';
import { GoalPeriod } from '../value-objects/goal-period.vo';

export type GoalStatus = 'active' | 'upcoming' | 'concluded';

export interface GoalProps {
  id?: string;
  period: GoalPeriod;
  deliveriesPerPeriod: number;
  monthlyDeadlineDay: number; // 1..31
  notes?: string | null;
  isArchived?: boolean;
  createdById: string;
  updatedById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StatusReportGoal extends BaseEntity {
  private readonly _period: GoalPeriod;
  private _deliveriesPerPeriod: number;
  private _monthlyDeadlineDay: number;
  private _notes: string | null;
  private _isArchived: boolean;
  private readonly _createdById: string;
  private _updatedById: string | null;

  constructor(props: GoalProps) {
    super(props.id);
    this._period = props.period;
    this._deliveriesPerPeriod = props.deliveriesPerPeriod;
    this._monthlyDeadlineDay = props.monthlyDeadlineDay;
    this._notes = props.notes ?? null;
    this._isArchived = props.isArchived ?? false;
    this._createdById = props.createdById;
    this._updatedById = props.updatedById ?? null;
  }

  get period(): GoalPeriod {
    return this._period;
  }
  get deliveriesPerPeriod(): number {
    return this._deliveriesPerPeriod;
  }
  get monthlyDeadlineDay(): number {
    return this._monthlyDeadlineDay;
  }
  get notes(): string | null {
    return this._notes;
  }
  get isArchived(): boolean {
    return this._isArchived;
  }
  get createdById(): string {
    return this._createdById;
  }
  get updatedById(): string | null {
    return this._updatedById;
  }

  status(now: Date = new Date()): GoalStatus {
    if (now < this._period.startDate) return 'upcoming';
    if (now > this._period.endDate) return 'concluded';
    return 'active';
  }

  updateDeliveriesPerPeriod(value: number, updatedById: string): void {
    this._deliveriesPerPeriod = value;
    this._updatedById = updatedById;
    this.touch();
  }

  updateMonthlyDeadlineDay(value: number, updatedById: string): void {
    this._monthlyDeadlineDay = value;
    this._updatedById = updatedById;
    this.touch();
  }

  updateNotes(value: string | null, updatedById: string): void {
    this._notes = value;
    this._updatedById = updatedById;
    this.touch();
  }

  archive(updatedById: string): void {
    this._isArchived = true;
    this._updatedById = updatedById;
    this.touch();
  }

  unarchive(updatedById: string): void {
    this._isArchived = false;
    this._updatedById = updatedById;
    this.touch();
  }
}
