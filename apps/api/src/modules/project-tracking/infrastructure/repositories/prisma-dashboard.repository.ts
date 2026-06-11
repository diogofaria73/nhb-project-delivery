import { Injectable } from '@nestjs/common';
import type { ProjectStatus } from '@nhb-status-report/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import {
  DashboardAggregation,
  DashboardProjectRow,
  IDashboardRepository,
  PortfolioBuckets,
  PreviousSnapshotForDelta,
} from '../../domain/repositories/dashboard.repository';

interface PortfolioRow {
  project_status: ProjectStatus;
  total: bigint;
}

interface WeeklyRow {
  iso_week: number;
  sent_count: bigint;
  expected_count: bigint;
}

interface ProjectRow {
  id: string;
  project_id: string;
  project_name: string;
  project_status: ProjectStatus;
  pm: string | null;
  responsible: string | null;
  responsible_detail: string | null;
  notes: string | null;
  week_flags: Buffer;
  weeks_sent: number;
  weeks_expected: number;
  first_active_week: number | null;
  last_sent_week: number | null;
}

@Injectable()
export class PrismaDashboardRepository implements IDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async fetchAggregation(
    importId: string,
    currentISOWeek: number,
    weeksInYear: number,
  ): Promise<DashboardAggregation> {
    const [portfolioRows, weeklyRows, projectRows] = await Promise.all([
      this.fetchPortfolio(importId),
      this.fetchWeeklyBars(importId, currentISOWeek, weeksInYear),
      this.fetchProjects(importId),
    ]);

    const portfolio = this.aggregatePortfolio(portfolioRows);

    return {
      portfolio,
      weeklyBars: weeklyRows.map((row) => ({
        isoWeek: Number(row.iso_week),
        sentCount: Number(row.sent_count),
        expectedCount: Number(row.expected_count),
      })),
      projects: projectRows.map((row) => this.toProjectRow(row)),
    };
  }

  async fetchSnapshotsForDelta(
    importId: string,
  ): Promise<PreviousSnapshotForDelta[]> {
    const rows = await this.prisma.projectSnapshot.findMany({
      where: { importId },
      select: {
        projectId: true,
        projectName: true,
        projectStatus: true,
        weekFlags: true,
      },
    });
    return rows.map((row) => ({
      projectId: row.projectId,
      projectName: row.projectName,
      projectStatus: row.projectStatus as ProjectStatus,
      weekFlags: Buffer.from(row.weekFlags),
    }));
  }

  private async fetchPortfolio(importId: string): Promise<PortfolioRow[]> {
    return this.prisma.$queryRaw<PortfolioRow[]>(
      Prisma.sql`
        SELECT project_status, COUNT(*)::bigint AS total
        FROM project_snapshots
        WHERE import_id = ${importId}
        GROUP BY project_status
      `,
    );
  }

  private async fetchWeeklyBars(
    importId: string,
    currentISOWeek: number,
    weeksInYear: number,
  ): Promise<WeeklyRow[]> {
    return this.prisma.$queryRaw<WeeklyRow[]>(
      Prisma.sql`
        WITH weeks AS (
          SELECT generate_series(1, ${weeksInYear})::int AS iso_week
        ),
        snapshots AS (
          SELECT
            project_status,
            week_flags,
            COALESCE(first_active_week, 1) AS first_active_week
          FROM project_snapshots
          WHERE import_id = ${importId}
        )
        SELECT
          weeks.iso_week,
          COALESCE(SUM(
            CASE
              WHEN snapshots.project_status = 'ACTIVE'
                   AND get_bit(snapshots.week_flags, weeks.iso_week - 1) = 1
              THEN 1 ELSE 0
            END
          ), 0)::bigint AS sent_count,
          COALESCE(SUM(
            CASE
              WHEN snapshots.project_status = 'ACTIVE'
                   AND weeks.iso_week >= snapshots.first_active_week
                   AND weeks.iso_week <= ${currentISOWeek}
              THEN 1 ELSE 0
            END
          ), 0)::bigint AS expected_count
        FROM weeks
        LEFT JOIN snapshots ON true
        GROUP BY weeks.iso_week
        ORDER BY weeks.iso_week
      `,
    );
  }

  private async fetchProjects(importId: string): Promise<ProjectRow[]> {
    return this.prisma.$queryRaw<ProjectRow[]>(
      Prisma.sql`
        SELECT
          id,
          project_id,
          project_name,
          project_status,
          pm,
          responsible,
          responsible_detail,
          notes,
          week_flags,
          weeks_sent,
          weeks_expected,
          first_active_week,
          last_sent_week
        FROM project_snapshots
        WHERE import_id = ${importId}
        ORDER BY project_id
      `,
    );
  }

  private aggregatePortfolio(rows: PortfolioRow[]): PortfolioBuckets {
    const map: Record<ProjectStatus, number> = {
      ACTIVE: 0,
      ON_HOLD: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NOT_STARTED: 0,
    };
    let total = 0;
    for (const row of rows) {
      const count = Number(row.total);
      map[row.project_status] = count;
      total += count;
    }
    return {
      total,
      active: map.ACTIVE,
      onHold: map.ON_HOLD,
      completed: map.COMPLETED,
      cancelled: map.CANCELLED,
      notStarted: map.NOT_STARTED,
    };
  }

  private toProjectRow(row: ProjectRow): DashboardProjectRow {
    return {
      snapshotId: row.id,
      projectId: row.project_id,
      projectName: row.project_name,
      projectStatus: row.project_status,
      pm: row.pm,
      responsible: row.responsible,
      responsibleDetail: row.responsible_detail,
      notes: row.notes,
      weekFlags: Buffer.from(row.week_flags),
      weeksSent: row.weeks_sent,
      weeksExpected: row.weeks_expected,
      firstActiveWeek: row.first_active_week,
      lastSentWeek: row.last_sent_week,
    };
  }
}
