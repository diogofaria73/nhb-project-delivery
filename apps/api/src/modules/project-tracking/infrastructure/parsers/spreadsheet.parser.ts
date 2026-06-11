import ExcelJS from 'exceljs';
import type { ParseRowError, ParsePreviewRow } from '@nhb-status-report/shared';
import {
  CANONICAL_HEADERS,
  REQUIRED_HEADERS,
  normalizeHeader,
  weekHeader,
} from './header-normalizer';
import { mapRow, isRowMapError, type ColumnLayout } from './row-mapper';
import { computeBiSanity } from './bi-sanity-checker';
import { ERROR_CAP, MAX_ISO_WEEKS, type AcceptedRow, type ParseResult } from './types';

export class SpreadsheetParseError extends Error {}

// Accept any "StatusReport_<year>_NovaFormula" sheet — the reference year comes
// from the upload form, the sheet-name year is only informational.
const PRIMARY_SHEET_PATTERN = /^statusreport_(\d{4})_novaformula$/;
const BACKUP_SHEET_PATTERN = /backup/;

export async function parseSpreadsheet(
  buffer: Buffer | ArrayBuffer,
  _referenceYear: number,
): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  const data: ArrayBuffer = (
    buffer instanceof Buffer
      ? buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        )
      : (buffer as ArrayBuffer)
  ) as ArrayBuffer;
  try {
    await workbook.xlsx.load(data);
  } catch (err) {
    throw new SpreadsheetParseError(
      `Failed to parse XLSX file: ${(err as Error).message}`,
    );
  }

  const candidateSheets = workbook.worksheets.filter((ws) => {
    const normalized = normalizeHeader(ws.name);
    if (BACKUP_SHEET_PATTERN.test(normalized)) return false;
    return PRIMARY_SHEET_PATTERN.test(normalized);
  });
  const primarySheet = candidateSheets[0];

  if (!primarySheet) {
    throw new SpreadsheetParseError(
      'No "StatusReport_YYYY_NovaFormula" sheet found in the workbook',
    );
  }

  const biSheet = workbook.worksheets.find(
    (ws) => normalizeHeader(ws.name) === 'bi',
  );

  const layout = resolveLayout(primarySheet);

  let totalRowsRead = 0;
  let rowsSkipped = 0;
  const acceptedRows: AcceptedRow[] = [];
  const rejectedRows: ParseRowError[] = [];
  let errorsTruncated = false;
  const seenProjectIds = new Set<string>();

  for (let rowNumber = 2; rowNumber <= primarySheet.rowCount; rowNumber++) {
    const row = primarySheet.getRow(rowNumber);
    if (isRowEmpty(row, layout)) {
      rowsSkipped++;
      continue;
    }
    totalRowsRead++;

    const mapped = mapRow(row, rowNumber, layout);
    if (isRowMapError(mapped)) {
      pushError(rejectedRows, { rowNumber, projectId: null, reason: mapped.reason });
      continue;
    }

    if (seenProjectIds.has(mapped.projectId)) {
      pushError(rejectedRows, {
        rowNumber,
        projectId: mapped.projectId,
        reason: `Duplicate Project ID in file (already seen)`,
      });
      continue;
    }
    seenProjectIds.add(mapped.projectId);
    acceptedRows.push(mapped);
  }

  if (rejectedRows.length > ERROR_CAP) {
    rejectedRows.length = ERROR_CAP;
    errorsTruncated = true;
  }

  const biSanity = computeBiSanity(biSheet, acceptedRows);

  const preview: ParsePreviewRow[] = acceptedRows.slice(0, 10).map((row) => ({
    projectId: row.projectId,
    projectName: row.projectName,
    projectStatus: row.projectStatus,
    pm: row.pm,
    responsible: row.responsible,
    weeksSent: row.weeksSent,
    weeksExpected: 0, // computed at confirm time using IsoWeekService — preview shows raw weeksSent only
  }));

  return {
    totalRowsRead,
    rowsSkipped,
    acceptedRows,
    rejectedRows,
    errorsTruncated,
    biSanity,
    preview,
  };

  function pushError(target: ParseRowError[], err: ParseRowError) {
    if (target.length >= ERROR_CAP) {
      errorsTruncated = true;
      return;
    }
    target.push(err);
  }
}

function isRowEmpty(row: ExcelJS.Row, layout: ColumnLayout): boolean {
  const projectId = row.getCell(layout.projectId).value;
  const projectName = row.getCell(layout.projectName).value;
  return (
    (projectId === null || projectId === undefined || projectId === '') &&
    (projectName === null || projectName === undefined || projectName === '')
  );
}

function resolveLayout(sheet: ExcelJS.Worksheet): ColumnLayout {
  const headerRow = sheet.getRow(1);
  const headerToCol = new Map<string, number>();
  headerRow.eachCell((cell, colNumber) => {
    const normalized = normalizeHeader(
      typeof cell.value === 'string' ? cell.value : String(cell.value ?? ''),
    );
    if (normalized) headerToCol.set(normalized, colNumber);
  });

  for (const required of REQUIRED_HEADERS) {
    if (!headerToCol.has(required)) {
      throw new SpreadsheetParseError(
        `Missing required header column: "${required}"`,
      );
    }
  }
  for (let week = 1; week <= 52; week++) {
    if (!headerToCol.has(weekHeader(week))) {
      throw new SpreadsheetParseError(
        `Missing required header column: "${weekHeader(week)}"`,
      );
    }
  }

  const weekColumns: (number | null)[] = [];
  for (let week = 1; week <= MAX_ISO_WEEKS; week++) {
    weekColumns.push(headerToCol.get(weekHeader(week)) ?? null);
  }

  return {
    projectId: headerToCol.get(CANONICAL_HEADERS.projectId)!,
    projectName: headerToCol.get(CANONICAL_HEADERS.projectName)!,
    projectStatus: headerToCol.get(CANONICAL_HEADERS.projectStatus)!,
    responsible: headerToCol.get(CANONICAL_HEADERS.responsible) ?? null,
    notes: headerToCol.get(CANONICAL_HEADERS.notes) ?? null,
    pm: headerToCol.get(CANONICAL_HEADERS.pm) ?? null,
    responsibleDetail: headerToCol.get(CANONICAL_HEADERS.responsibleDetail) ?? null,
    weekColumns,
  };
}
