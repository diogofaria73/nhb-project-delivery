import { Module } from '@nestjs/common';
import { CompaniesModule } from '@modules/companies/companies.module';
import { StatusReportGoalsModule } from '@modules/status-report-goals/status-report-goals.module';
import { StatusReportsController } from './presentation/controllers/status-reports.controller';
import { StatusReportPrismaRepository } from './infrastructure/repositories/status-report.prisma-repository';
import { STATUS_REPORT_REPOSITORY } from './domain/repositories/status-report.repository';
import {
  CreateSubmissionUseCase,
  UpdateSubmissionUseCase,
  DeleteSubmissionUseCase,
  ListSubmissionsUseCase,
  FindSubmissionUseCase,
  DownloadAttachmentUseCase,
  GetSubmissionsSummaryUseCase,
} from './application/use-cases';
import {
  AnalyticsOverviewUseCase,
  AnalyticsCompaniesUseCase,
  AnalyticsHeatmapUseCase,
  AnalyticsExportUseCase,
} from './application/analytics';

@Module({
  imports: [CompaniesModule, StatusReportGoalsModule],
  controllers: [StatusReportsController],
  providers: [
    {
      provide: STATUS_REPORT_REPOSITORY,
      useClass: StatusReportPrismaRepository,
    },
    CreateSubmissionUseCase,
    UpdateSubmissionUseCase,
    DeleteSubmissionUseCase,
    ListSubmissionsUseCase,
    FindSubmissionUseCase,
    DownloadAttachmentUseCase,
    GetSubmissionsSummaryUseCase,
    AnalyticsOverviewUseCase,
    AnalyticsCompaniesUseCase,
    AnalyticsHeatmapUseCase,
    AnalyticsExportUseCase,
  ],
})
export class StatusReportsModule {}
