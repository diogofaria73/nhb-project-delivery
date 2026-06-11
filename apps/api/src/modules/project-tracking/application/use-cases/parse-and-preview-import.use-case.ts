import { createHash } from 'crypto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ParseReportDto } from '@nhb-status-report/shared';
import {
  parseSpreadsheet,
  SpreadsheetParseError,
} from '../../infrastructure/parsers/spreadsheet.parser';
import { calculateDelta } from '../../infrastructure/parsers/delta-calculator';
import { IsoWeekService } from '../../domain/services/iso-week.service';
import {
  DASHBOARD_REPOSITORY,
  IDashboardRepository,
} from '../../domain/repositories/dashboard.repository';
import {
  IProjectImportRepository,
  PROJECT_IMPORT_REPOSITORY,
} from '../../domain/repositories/project-import.repository';
import { MAX_ISO_WEEKS } from '../../infrastructure/parsers/types';

export interface ParseAndPreviewInput {
  buffer: Buffer;
  originalFilename: string;
  referenceYear: number;
}

@Injectable()
export class ParseAndPreviewImportUseCase {
  constructor(
    @Inject(PROJECT_IMPORT_REPOSITORY)
    private readonly importRepository: IProjectImportRepository,
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: IDashboardRepository,
    private readonly isoWeekService: IsoWeekService,
  ) {}

  async execute(input: ParseAndPreviewInput): Promise<ParseReportDto> {
    let parseResult;
    try {
      parseResult = await parseSpreadsheet(input.buffer, input.referenceYear);
    } catch (err) {
      if (err instanceof SpreadsheetParseError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const sha256 = createHash('sha256').update(input.buffer).digest('hex');

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
    const previewWithExpected = parseResult.preview.map((p, idx) => {
      const row = parseResult.acceptedRows[idx];
      return {
        ...p,
        weeksExpected: row ? this.weeksExpected(row, currentWeek) : 0,
      };
    });

    return {
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
      delta: {
        ...delta,
        weeklyOksAdded: delta.weeklyOksAdded.slice(0, MAX_ISO_WEEKS),
        weeklyOksRemoved: delta.weeklyOksRemoved.slice(0, MAX_ISO_WEEKS),
      },
      preview: previewWithExpected,
    };
  }

  private weeksExpected(
    row: { projectStatus: string; firstActiveWeek: number | null },
    currentWeek: number,
  ): number {
    if (row.projectStatus !== 'ACTIVE') return 0;
    if (currentWeek === 0) return 0;
    const first = row.firstActiveWeek ?? 1;
    if (currentWeek < first) return 0;
    return currentWeek - first + 1;
  }
}
