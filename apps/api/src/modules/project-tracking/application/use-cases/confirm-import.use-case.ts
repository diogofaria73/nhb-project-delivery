import { createHash, randomUUID } from 'crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { ParseReportDto } from '@nhb-status-report/shared';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
} from '@shared/infrastructure/storage/storage.interface';
import {
  parseSpreadsheet,
  SpreadsheetParseError,
} from '../../infrastructure/parsers/spreadsheet.parser';
import { calculateDelta } from '../../infrastructure/parsers/delta-calculator';
import { ImportSha256MismatchError } from '../../domain/errors/project-tracking.errors';
import { IsoWeekService } from '../../domain/services/iso-week.service';
import {
  DASHBOARD_REPOSITORY,
  IDashboardRepository,
} from '../../domain/repositories/dashboard.repository';
import {
  IProjectImportRepository,
  PROJECT_IMPORT_REPOSITORY,
} from '../../domain/repositories/project-import.repository';
import type { AcceptedRow } from '../../infrastructure/parsers/types';

export interface ConfirmImportInput {
  buffer: Buffer;
  originalFilename: string;
  referenceYear: number;
  expectedSha256: string;
  importedById: string;
}

export interface ConfirmImportResult {
  importId: string;
  rowsAccepted: number;
  rowsRejected: number;
}

@Injectable()
export class ConfirmImportUseCase {
  private readonly logger = new Logger(ConfirmImportUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
    @Inject(PROJECT_IMPORT_REPOSITORY)
    private readonly importRepository: IProjectImportRepository,
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: IDashboardRepository,
    private readonly isoWeekService: IsoWeekService,
  ) {}

  async execute(input: ConfirmImportInput): Promise<ConfirmImportResult> {
    const sha256 = createHash('sha256').update(input.buffer).digest('hex');
    if (sha256 !== input.expectedSha256) throw new ImportSha256MismatchError();

    let parseResult;
    try {
      parseResult = await parseSpreadsheet(input.buffer, input.referenceYear);
    } catch (err) {
      if (err instanceof SpreadsheetParseError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const previousActive = await this.importRepository.findActiveForYear(
      input.referenceYear,
    );
    const previousSnapshots = previousActive
      ? await this.dashboardRepository.fetchSnapshotsForDelta(previousActive.id)
      : null;
    const delta = calculateDelta(parseResult.acceptedRows, previousSnapshots);

    const currentWeek = this.isoWeekService.effectiveCurrentWeek(
      input.referenceYear,
    );

    const importId = randomUUID();
    const storageKey = `project-imports/${input.referenceYear}/${importId}.xlsx`;
    await this.storage.save(
      input.buffer,
      `${importId}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    const parseReport: ParseReportDto = {
      referenceYear: input.referenceYear,
      originalFilename: input.originalFilename,
      fileSizeBytes: input.buffer.byteLength,
      sha256,
      totalRowsRead: parseResult.totalRowsRead,
      rowsAccepted: parseResult.acceptedRows.length,
      rowsSkipped: parseResult.rowsSkipped,
      rowsRejected: parseResult.rejectedRows.length,
      errors: parseResult.rejectedRows,
      errorsTruncated: parseResult.errorsTruncated,
      biSanity: parseResult.biSanity,
      delta,
      preview: parseResult.preview,
    };

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.projectImport.create({
          data: {
            id: importId,
            referenceYear: input.referenceYear,
            status: 'PROCESSING',
            originalFilename: input.originalFilename,
            fileSizeBytes: input.buffer.byteLength,
            sha256,
            storageKey,
            parseReport: parseReport as unknown as object,
            rowsAccepted: parseResult.acceptedRows.length,
            rowsRejected: parseResult.rejectedRows.length,
            importedById: input.importedById,
          },
        });

        if (parseResult.acceptedRows.length > 0) {
          await tx.projectSnapshot.createMany({
            data: parseResult.acceptedRows.map((row) =>
              this.toSnapshotRow(importId, row, currentWeek),
            ),
          });
        }

        if (previousActive) {
          await tx.projectImport.update({
            where: { id: previousActive.id },
            data: { status: 'SUPERSEDED' },
          });
        }

        await tx.projectImport.update({
          where: { id: importId },
          data: { status: 'ACTIVE' },
        });
      });
    } catch (err) {
      this.logger.error(
        `Confirm import failed for ${importId}, cleaning up storage`,
        err as Error,
      );
      await this.storage.delete(storageKey).catch(() => undefined);
      await this.prisma.projectImport
        .updateMany({
          where: { id: importId },
          data: { status: 'FAILED' },
        })
        .catch(() => undefined);
      throw err;
    }

    return {
      importId,
      rowsAccepted: parseResult.acceptedRows.length,
      rowsRejected: parseResult.rejectedRows.length,
    };
  }

  private toSnapshotRow(
    importId: string,
    row: AcceptedRow,
    currentWeek: number,
  ) {
    const weeksExpected = this.computeWeeksExpected(row, currentWeek);
    return {
      id: randomUUID(),
      importId,
      projectId: row.projectId,
      projectName: row.projectName,
      projectStatus: row.projectStatus,
      responsible: row.responsible,
      responsibleDetail: row.responsibleDetail,
      pm: row.pm,
      notes: row.notes,
      weekFlags: Uint8Array.from(row.weekFlags),
      weeksSent: row.weeksSent,
      weeksExpected,
      firstActiveWeek: row.firstActiveWeek,
      lastSentWeek: row.lastSentWeek,
    };
  }

  private computeWeeksExpected(row: AcceptedRow, currentWeek: number): number {
    if (row.projectStatus !== 'ACTIVE') return 0;
    if (currentWeek === 0) return 0;
    const first = row.firstActiveWeek ?? 1;
    if (currentWeek < first) return 0;
    return currentWeek - first + 1;
  }
}
