import { Inject, Injectable } from '@nestjs/common';
import type {
  DashboardResponseDto,
  ProjectRowDto,
  WeeklyBarDto,
} from '@nhb-status-report/shared';
import {
  IProjectImportRepository,
  PROJECT_IMPORT_REPOSITORY,
} from '../../domain/repositories/project-import.repository';
import {
  DASHBOARD_REPOSITORY,
  type DashboardProjectRow,
  type IDashboardRepository,
  type WeeklyBarRow,
} from '../../domain/repositories/dashboard.repository';
import { IsoWeekService } from '../../domain/services/iso-week.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class GetDashboardUseCase {
  constructor(
    @Inject(PROJECT_IMPORT_REPOSITORY)
    private readonly importRepository: IProjectImportRepository,
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: IDashboardRepository,
    private readonly isoWeekService: IsoWeekService,
  ) {}

  async execute(year: number): Promise<DashboardResponseDto> {
    const active = await this.importRepository.findActiveForYear(year);
    const weeksInYear = this.isoWeekService.weeksInYear(year);
    const currentISOWeekInfo = this.isoWeekService.getCurrentISOWeek();
    const currentWeekForYear = this.isoWeekService.effectiveCurrentWeek(year);

    if (!active) {
      return {
        referenceYear: year,
        hasActiveImport: false,
        header: {
          importId: null,
          importedAt: null,
          importedByName: null,
          originalFilename: null,
          freshness: null,
          daysSinceImport: null,
        },
        currentWeek: {
          isoWeek: currentISOWeekInfo.isoWeek,
          weekStart: currentISOWeekInfo.weekStart.toISOString(),
          weekEnd: currentISOWeekInfo.weekEnd.toISOString(),
          activeProjects: 0,
          sentThisWeek: 0,
          percent: null,
        },
        portfolio: {
          totalProjects: 0,
          active: 0,
          onHold: 0,
          completed: 0,
          cancelled: 0,
          notStarted: 0,
        },
        annualConsolidated: { weeksSent: 0, weeksExpected: 0, percent: null },
        weeklyBars: this.emptyWeeklyBars(weeksInYear, currentWeekForYear),
        projects: [],
      };
    }

    const aggregation = await this.dashboardRepository.fetchAggregation(
      active.id,
      currentWeekForYear,
      weeksInYear,
    );

    const daysSinceImport = Math.floor(
      (Date.now() - active.importedAt.getTime()) / MS_PER_DAY,
    );
    const freshness = this.classifyFreshness(daysSinceImport);

    const projects: ProjectRowDto[] = aggregation.projects.map((row) =>
      this.toProjectRow(row),
    );

    const weeksSentTotal = aggregation.projects.reduce(
      (sum, row) => sum + row.weeksSent,
      0,
    );
    const weeksExpectedTotal = aggregation.projects.reduce(
      (sum, row) => sum + row.weeksExpected,
      0,
    );

    const currentBar =
      aggregation.weeklyBars.find((b) => b.isoWeek === currentWeekForYear) ?? {
        isoWeek: currentWeekForYear,
        sentCount: 0,
        expectedCount: 0,
      };

    const weeklyBars: WeeklyBarDto[] = aggregation.weeklyBars.map((row) =>
      this.toWeeklyBar(row, currentWeekForYear),
    );

    return {
      referenceYear: year,
      hasActiveImport: true,
      header: {
        importId: active.id,
        importedAt: active.importedAt.toISOString(),
        importedByName: active.importedByName,
        originalFilename: active.originalFilename,
        freshness,
        daysSinceImport,
      },
      currentWeek: {
        isoWeek: currentISOWeekInfo.isoWeek,
        weekStart: currentISOWeekInfo.weekStart.toISOString(),
        weekEnd: currentISOWeekInfo.weekEnd.toISOString(),
        activeProjects: aggregation.portfolio.active,
        sentThisWeek: currentBar.sentCount,
        percent: this.safePercent(
          currentBar.sentCount,
          aggregation.portfolio.active,
        ),
      },
      portfolio: {
        totalProjects: aggregation.portfolio.total,
        active: aggregation.portfolio.active,
        onHold: aggregation.portfolio.onHold,
        completed: aggregation.portfolio.completed,
        cancelled: aggregation.portfolio.cancelled,
        notStarted: aggregation.portfolio.notStarted,
      },
      annualConsolidated: {
        weeksSent: weeksSentTotal,
        weeksExpected: weeksExpectedTotal,
        percent: active.annualConsolidatedPercent,
      },
      weeklyBars,
      projects,
    };
  }

  private toProjectRow(row: DashboardProjectRow): ProjectRowDto {
    return {
      snapshotId: row.snapshotId,
      projectId: row.projectId,
      projectName: row.projectName,
      projectStatus: row.projectStatus,
      pm: row.pm,
      responsible: row.responsible,
      responsibleDetail: row.responsibleDetail,
      notes: row.notes,
      weekFlagsBase64: row.weekFlags.toString('base64'),
      weeksSent: row.weeksSent,
      weeksExpected: row.weeksExpected,
      compliancePercent: this.safePercent(row.weeksSent, row.weeksExpected),
      firstActiveWeek: row.firstActiveWeek,
      lastSentWeek: row.lastSentWeek,
    };
  }

  private toWeeklyBar(row: WeeklyBarRow, currentWeek: number): WeeklyBarDto {
    return {
      isoWeek: row.isoWeek,
      sentCount: row.sentCount,
      expectedCount: row.expectedCount,
      percent: this.safePercent(row.sentCount, row.expectedCount),
      isFuture: row.isoWeek > currentWeek,
      isCurrent: row.isoWeek === currentWeek,
    };
  }

  private emptyWeeklyBars(
    weeksInYear: number,
    currentWeek: number,
  ): WeeklyBarDto[] {
    const result: WeeklyBarDto[] = [];
    for (let week = 1; week <= weeksInYear; week++) {
      result.push({
        isoWeek: week,
        sentCount: 0,
        expectedCount: 0,
        percent: null,
        isFuture: week > currentWeek,
        isCurrent: week === currentWeek,
      });
    }
    return result;
  }

  private classifyFreshness(days: number): 'GREEN' | 'AMBER' | 'RED' {
    if (days <= 7) return 'GREEN';
    if (days <= 14) return 'AMBER';
    return 'RED';
  }

  private safePercent(numerator: number, denominator: number): number | null {
    if (denominator <= 0) return null;
    return Math.round((numerator / denominator) * 10000) / 100;
  }
}
