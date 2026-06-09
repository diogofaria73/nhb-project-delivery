import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import {
  CurrentUser,
  AuthenticatedUser,
} from '@shared/infrastructure/decorators/current-user.decorator';
import { CreateSubmissionDto } from '../../application/dtos/create-submission.dto';
import { UpdateSubmissionDto } from '../../application/dtos/update-submission.dto';
import { ListSubmissionsQueryDto } from '../../application/dtos/list-submissions-query.dto';
import {
  CreateSubmissionUseCase,
  UploadedFile,
} from '../../application/use-cases/create-submission.use-case';
import {
  UpdateSubmissionUseCase,
  DeleteSubmissionUseCase,
  ListSubmissionsUseCase,
  FindSubmissionUseCase,
  DownloadAttachmentUseCase,
  GetSubmissionsSummaryUseCase,
} from '../../application/use-cases';
import { SubmissionsSummaryQueryDto } from '../../application/dtos/submissions-summary-query.dto';
import {
  AnalyticsOverviewUseCase,
  AnalyticsCompaniesUseCase,
  AnalyticsHeatmapUseCase,
  AnalyticsExportUseCase,
} from '../../application/analytics';
import { AnalyticsRangeDto } from '../../application/analytics/analytics-range.dto';
import { AnalyticsCompaniesQueryDto } from '../../application/analytics/analytics-companies-query.dto';
import { AnalyticsExportQueryDto } from '../../application/analytics/analytics-export-query.dto';

const MAX_FILES = 10;
const PER_FILE_LIMIT = 25 * 1024 * 1024;

@ApiTags('Status Reports')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('status-reports')
export class StatusReportsController {
  constructor(
    private readonly createSubmissionUseCase: CreateSubmissionUseCase,
    private readonly updateSubmissionUseCase: UpdateSubmissionUseCase,
    private readonly deleteSubmissionUseCase: DeleteSubmissionUseCase,
    private readonly listSubmissionsUseCase: ListSubmissionsUseCase,
    private readonly findSubmissionUseCase: FindSubmissionUseCase,
    private readonly downloadAttachmentUseCase: DownloadAttachmentUseCase,
    private readonly getSubmissionsSummaryUseCase: GetSubmissionsSummaryUseCase,
    private readonly analyticsOverviewUseCase: AnalyticsOverviewUseCase,
    private readonly analyticsCompaniesUseCase: AnalyticsCompaniesUseCase,
    private readonly analyticsHeatmapUseCase: AnalyticsHeatmapUseCase,
    private readonly analyticsExportUseCase: AnalyticsExportUseCase,
  ) {}

  // ── Analytics (Admin) — declared first so they don't collide with /:id ────
  @Roles('ADMINISTRATOR')
  @Get('analytics/overview')
  @ApiOperation({ summary: 'KPIs + monthly buckets for the chosen period' })
  async overview(@Query() query: AnalyticsRangeDto) {
    return this.analyticsOverviewUseCase.execute(query);
  }

  @Roles('ADMINISTRATOR')
  @Get('analytics/companies')
  @ApiOperation({ summary: 'Per-company compliance breakdown' })
  async analyticsCompanies(@Query() query: AnalyticsCompaniesQueryDto) {
    return this.analyticsCompaniesUseCase.execute(query);
  }

  @Roles('ADMINISTRATOR')
  @Get('analytics/heatmap')
  @ApiOperation({ summary: 'Company × month compliance matrix' })
  async heatmap(@Query() query: AnalyticsRangeDto) {
    return this.analyticsHeatmapUseCase.execute(query);
  }

  @Roles('ADMINISTRATOR')
  @Get('analytics/export')
  @ApiOperation({ summary: 'CSV export of analytics (flat or summary)' })
  async export(
    @Query() query: AnalyticsExportQueryDto,
    @Res({ passthrough: false }) res: Response,
  ) {
    const csv = await this.analyticsExportUseCase.execute(query);
    const filename = `status-report-analytics-${query.from}-${query.to}-${query.kind ?? 'flat'}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  // ── Summary (per-submission counts, goal-aware) ───────────────────────────
  @Get('summary')
  @ApiOperation({
    summary: 'Per-submission counts (delivered / on-time / late) for the period',
  })
  async summary(@Query() query: SubmissionsSummaryQueryDto) {
    return this.getSubmissionsSummaryUseCase.execute(query);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List submissions' })
  @ApiResponse({ status: 200, description: 'Paginated list' })
  async findAll(@Query() query: ListSubmissionsQueryDto) {
    return this.listSubmissionsUseCase.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a submission by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.findSubmissionUseCase.execute(id);
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('attachments', MAX_FILES, {
      limits: { fileSize: PER_FILE_LIMIT },
    }),
  )
  @ApiOperation({ summary: 'Create a submission with optional attachments' })
  @ApiResponse({ status: 201, description: 'Submission registered' })
  async create(
    @Body() dto: CreateSubmissionDto,
    @UploadedFiles() files: UploadedFile[] = [],
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.createSubmissionUseCase.execute(dto, files ?? [], currentUser.userId);
  }

  @Roles('ADMINISTRATOR')
  @Put(':id')
  @ApiOperation({ summary: 'Update submission metadata (Admin only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubmissionDto,
  ) {
    return this.updateSubmissionUseCase.execute(id, dto);
  }

  @Roles('ADMINISTRATOR')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete submission and its attachments (Admin only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteSubmissionUseCase.execute(id);
  }

  @Get(':id/attachments/:attachmentId')
  @ApiOperation({ summary: 'Stream an attachment file' })
  async downloadAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const download = await this.downloadAttachmentUseCase.execute(id, attachmentId);
    res.setHeader('Content-Type', download.mimeType);
    res.setHeader('Content-Length', download.sizeBytes);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(download.filename)}"`,
    );
    download.stream.pipe(res);
  }
}
