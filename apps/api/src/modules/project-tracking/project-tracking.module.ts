import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { StorageModule } from '@shared/infrastructure/storage/storage.module';
import { ProjectTrackingController } from './presentation/controllers/project-tracking.controller';
import { ProjectTrackingExceptionFilter } from './presentation/filters/project-tracking-exception.filter';
import { IsoWeekService } from './domain/services/iso-week.service';
import { PROJECT_IMPORT_REPOSITORY } from './domain/repositories/project-import.repository';
import { DASHBOARD_REPOSITORY } from './domain/repositories/dashboard.repository';
import { PrismaProjectImportRepository } from './infrastructure/repositories/prisma-project-import.repository';
import { PrismaDashboardRepository } from './infrastructure/repositories/prisma-dashboard.repository';
import {
  ConfirmImportUseCase,
  DeleteImportUseCase,
  DownloadImportFileUseCase,
  GetDashboardUseCase,
  GetImportUseCase,
  GetProjectDetailUseCase,
  ListImportsUseCase,
  ParseAndPreviewImportUseCase,
  RestoreImportUseCase,
} from './application/use-cases';

@Module({
  imports: [StorageModule],
  controllers: [ProjectTrackingController],
  providers: [
    IsoWeekService,
    { provide: PROJECT_IMPORT_REPOSITORY, useClass: PrismaProjectImportRepository },
    { provide: DASHBOARD_REPOSITORY, useClass: PrismaDashboardRepository },
    ParseAndPreviewImportUseCase,
    ConfirmImportUseCase,
    ListImportsUseCase,
    GetImportUseCase,
    DownloadImportFileUseCase,
    RestoreImportUseCase,
    DeleteImportUseCase,
    GetDashboardUseCase,
    GetProjectDetailUseCase,
    { provide: APP_FILTER, useClass: ProjectTrackingExceptionFilter },
  ],
})
export class ProjectTrackingModule {}
