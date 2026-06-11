import type { Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '@shared/infrastructure/decorators/current-user.decorator';
import { ConfirmImportDto } from '../../application/dtos/confirm-import.dto';
import { PreviewImportDto } from '../../application/dtos/preview-import.dto';
import { ListImportsDto } from '../../application/dtos/list-imports.dto';
import { DashboardQueryDto } from '../../application/dtos/dashboard-query.dto';
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
} from '../../application/use-cases';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

@ApiTags('Project Tracking')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('project-tracking')
export class ProjectTrackingController {
  constructor(
    private readonly parseAndPreview: ParseAndPreviewImportUseCase,
    private readonly confirmImport: ConfirmImportUseCase,
    private readonly listImports: ListImportsUseCase,
    private readonly getImport: GetImportUseCase,
    private readonly downloadImportFile: DownloadImportFileUseCase,
    private readonly restoreImport: RestoreImportUseCase,
    private readonly deleteImport: DeleteImportUseCase,
    private readonly getDashboard: GetDashboardUseCase,
    private readonly getProjectDetail: GetProjectDetailUseCase,
  ) {}

  @Post('imports/preview')
  @Roles('ADMINISTRATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parse the spreadsheet and return a dry-run report' })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async preview(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewImportDto,
  ) {
    this.assertXlsx(file);
    return this.parseAndPreview.execute({
      buffer: file!.buffer,
      originalFilename: file!.originalname,
      referenceYear: dto.referenceYear,
    });
  }

  @Post('imports/confirm')
  @Roles('ADMINISTRATOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Persist the spreadsheet as a new active import (snapshot)',
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async confirm(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: ConfirmImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertXlsx(file);
    return this.confirmImport.execute({
      buffer: file!.buffer,
      originalFilename: file!.originalname,
      referenceYear: dto.referenceYear,
      expectedSha256: dto.expectedSha256,
      importedById: user.userId,
    });
  }

  @Get('imports')
  @Roles('ADMINISTRATOR')
  @ApiOperation({ summary: 'List imports with optional filters' })
  list(@Query() query: ListImportsDto) {
    return this.listImports.execute(query);
  }

  @Get('imports/:id')
  @Roles('ADMINISTRATOR')
  @ApiOperation({ summary: 'Get import details including parse report' })
  get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.getImport.execute(id);
  }

  @Get('imports/:id/file')
  @ApiOperation({ summary: 'Download the original spreadsheet file' })
  async download(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() res: Response,
  ) {
    const result = await this.downloadImportFile.execute(id);
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Length', result.fileSizeBytes.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(result.originalFilename)}"`,
    );
    result.stream.pipe(res);
  }

  @Post('imports/:id/restore')
  @Roles('ADMINISTRATOR')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restore a SUPERSEDED import as the new ACTIVE one' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.restoreImport.execute(id);
  }

  @Delete('imports/:id')
  @Roles('ADMINISTRATOR')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a non-active import' })
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.deleteImport.execute(id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Fetch dashboard aggregation for the selected year' })
  dashboard(@Query() query: DashboardQueryDto) {
    const year = query.year ?? new Date().getFullYear();
    return this.getDashboard.execute(year);
  }

  @Get('projects/:snapshotId')
  @ApiOperation({ summary: 'Get project detail including weekly timeline' })
  projectDetail(@Param('snapshotId', new ParseUUIDPipe()) snapshotId: string) {
    return this.getProjectDetail.execute(snapshotId);
  }

  private assertXlsx(file: Express.Multer.File | undefined): void {
    if (!file) throw new BadRequestException('Missing "file" upload');
    if (file.mimetype !== XLSX_MIME) {
      throw new BadRequestException(
        `Invalid mime type: ${file.mimetype}. Expected ${XLSX_MIME}.`,
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('File exceeds the 10 MB limit');
    }
  }
}
