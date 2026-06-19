import ExcelJS from 'exceljs';
import type {
  ParseRowError,
  ParsePreviewRow,
  SkippedRowCell,
  SkippedRowDetail,
} from '@nhb-status-report/shared';
import {
  CANONICAL_HEADERS,
  REQUIRED_HEADERS,
  normalizeHeader,
  weekHeader,
} from './header-normalizer';
import { mapRow, isRowMapError, type ColumnLayout } from './row-mapper';
import { computeBiSanity } from './bi-sanity-checker';
import {
  ERROR_CAP,
  MAX_ISO_WEEKS,
  SKIPPED_CAP,
  type AcceptedRow,
  type ParseResult,
} from './types';

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
  const headerLabels = resolveHeaderLabels(primarySheet, layout);

  let totalRowsRead = 0;
  let rowsSkipped = 0;
  const skippedRows: SkippedRowDetail[] = [];
  let skippedRowsTruncated = false;
  const acceptedRows: AcceptedRow[] = [];
  const rejectedRows: ParseRowError[] = [];
  let errorsTruncated = false;
  const seenProjectIds = new Set<string>();

  for (let rowNumber = 2; rowNumber <= primarySheet.rowCount; rowNumber++) {
    const row = primarySheet.getRow(rowNumber);
    if (isRowEmpty(row, layout)) {
      rowsSkipped++;
      if (skippedRows.length < SKIPPED_CAP) {
        const sampleCells = collectNonEmptyCells(row, layout, headerLabels);
        skippedRows.push({ rowNumber, sampleCells });
      } else {
        skippedRowsTruncated = true;
      }
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
  const annualConsolidatedPercent = readAnnualConsolidatedPercent(biSheet);

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
    skippedRows,
    skippedRowsTruncated,
    acceptedRows,
    rejectedRows,
    errorsTruncated,
    biSanity,
    annualConsolidatedPercent,
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

interface ColumnHeader {
  column: number;
  label: string;
}

function resolveHeaderLabels(
  sheet: ExcelJS.Worksheet,
  layout: ColumnLayout,
): ColumnHeader[] {
  const headerRow = sheet.getRow(1);
  const labels: ColumnHeader[] = [];
  const known = new Set<number>();

  const push = (column: number | null | undefined) => {
    if (column == null || known.has(column)) return;
    known.add(column);
    const raw = headerRow.getCell(column).value;
    const label =
      stringifyCellValue(raw)?.trim() || `Coluna ${columnLetter(column)}`;
    labels.push({ column, label });
  };

  push(layout.projectId);
  push(layout.projectName);
  push(layout.projectStatus);
  push(layout.pm);
  push(layout.responsible);
  push(layout.responsibleDetail);
  push(layout.notes);
  for (const wc of layout.weekColumns) push(wc);

  return labels;
}

function collectNonEmptyCells(
  row: ExcelJS.Row,
  _layout: ColumnLayout,
  headers: ColumnHeader[],
): SkippedRowCell[] {
  const out: SkippedRowCell[] = [];
  for (const { column, label } of headers) {
    const raw = row.getCell(column).value;
    const text = stringifyCellValue(raw);
    if (text === null) continue;
    const trimmed = text.trim();
    if (!trimmed) continue;
    out.push({
      header: label,
      value: trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed,
    });
  }
  return out;
}

function stringifyCellValue(value: ExcelJS.CellValue): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if ('text' in value && typeof (value as { text: unknown }).text === 'string') {
      return (value as { text: string }).text;
    }
    if (
      'richText' in value &&
      Array.isArray((value as { richText: unknown }).richText)
    ) {
      return (value as { richText: { text: string }[] }).richText
        .map((r) => r.text)
        .join('');
    }
    if ('result' in value) {
      const r = (value as { result: unknown }).result;
      if (r === null || r === undefined) return null;
      if (typeof r === 'string' || typeof r === 'number') return String(r);
    }
    if ('formula' in value && typeof (value as { formula: unknown }).formula === 'string') {
      return `=${(value as { formula: string }).formula}`;
    }
  }
  return String(value);
}

function columnLetter(column: number): string {
  let n = column;
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result || 'A';
}

// Reads the "Consolidado Anual" portfolio percent from BI!L2.
// Excel may store percents as fractional (0.85) or already-scaled (85);
// values ≤ 1 are treated as fractions and normalized to 0..100.
function readAnnualConsolidatedPercent(
  biSheet: ExcelJS.Worksheet | undefined,
): number | null {
  if (!biSheet) return null;
  const raw = biSheet.getCell('L2').value;
  let n: number | null = null;
  if (typeof raw === 'number') n = raw;
  else if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw.replace('%', '').trim());
    if (Number.isFinite(parsed)) n = parsed;
  } else if (raw && typeof raw === 'object' && 'result' in raw) {
    const r = (raw as { result: unknown }).result;
    if (typeof r === 'number') n = r;
  }
  if (n === null || !Number.isFinite(n)) return null;
  const scaled = Math.abs(n) <= 1 ? n * 100 : n;
  return Math.round(scaled * 100) / 100;
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
