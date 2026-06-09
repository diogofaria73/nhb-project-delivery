import { Injectable } from '@nestjs/common';
import { GoalPeriodType as PrismaGoalPeriodType } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import {
  GoalListedRow,
  IStatusReportGoalRepository,
} from '../../domain/repositories/goal.repository';
import { StatusReportGoal } from '../../domain/entities/status-report-goal.entity';
import { GoalPeriod, GoalPeriodType } from '../../domain/value-objects/goal-period.vo';

interface GoalRecord {
  id: string;
  periodType: PrismaGoalPeriodType;
  year: number;
  periodIndex: number | null;
  deliveriesPerPeriod: number;
  monthlyDeadlineDay: number;
  notes: string | null;
  isArchived: boolean;
  createdById: string;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface GoalRecordWithCreatedBy extends GoalRecord {
  createdBy: { name: string };
}

@Injectable()
export class StatusReportGoalPrismaRepository implements IStatusReportGoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<GoalListedRow | null> {
    const record = await this.prisma.statusReportGoal.findUnique({
      where: { id },
      include: { createdBy: true },
    });
    if (!record) return null;
    return this.toListed(record);
  }

  async findByPeriod(
    periodType: GoalPeriodType,
    year: number,
    periodIndex: number | null,
  ): Promise<StatusReportGoal | null> {
    const record = await this.prisma.statusReportGoal.findFirst({
      where: {
        periodType: periodType as PrismaGoalPeriodType,
        year,
        periodIndex,
      },
      include: { createdBy: true },
    });
    if (!record) return null;
    return this.toEntity(record);
  }

  async findAll(): Promise<GoalListedRow[]> {
    const records = await this.prisma.statusReportGoal.findMany({
      include: { createdBy: true },
      orderBy: [{ year: 'desc' }, { startDate: 'desc' }],
    });
    return records.map((r) => this.toListed(r));
  }

  async create(goal: StatusReportGoal): Promise<StatusReportGoal> {
    const record = await this.prisma.statusReportGoal.create({
      data: {
        id: goal.id,
        periodType: goal.period.type as PrismaGoalPeriodType,
        year: goal.period.year,
        periodIndex: goal.period.index,
        startDate: goal.period.startDate,
        endDate: goal.period.endDate,
        deliveriesPerPeriod: goal.deliveriesPerPeriod,
        monthlyDeadlineDay: goal.monthlyDeadlineDay,
        notes: goal.notes,
        isArchived: goal.isArchived,
        createdById: goal.createdById,
        updatedById: goal.updatedById,
      },
      include: { createdBy: true },
    });
    return this.toEntity(record);
  }

  async update(goal: StatusReportGoal): Promise<StatusReportGoal> {
    const record = await this.prisma.statusReportGoal.update({
      where: { id: goal.id },
      data: {
        deliveriesPerPeriod: goal.deliveriesPerPeriod,
        monthlyDeadlineDay: goal.monthlyDeadlineDay,
        notes: goal.notes,
        isArchived: goal.isArchived,
        updatedById: goal.updatedById,
      },
      include: { createdBy: true },
    });
    return this.toEntity(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.statusReportGoal.delete({ where: { id } });
  }

  private toEntity(record: GoalRecord): StatusReportGoal {
    const period = GoalPeriod.create({
      type: record.periodType as GoalPeriodType,
      year: record.year,
      index: record.periodIndex,
    });
    return new StatusReportGoal({
      id: record.id,
      period,
      deliveriesPerPeriod: record.deliveriesPerPeriod,
      monthlyDeadlineDay: record.monthlyDeadlineDay,
      notes: record.notes,
      isArchived: record.isArchived,
      createdById: record.createdById,
      updatedById: record.updatedById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private toListed(record: GoalRecordWithCreatedBy): GoalListedRow {
    return {
      goal: this.toEntity(record),
      createdByName: record.createdBy.name,
    };
  }
}
