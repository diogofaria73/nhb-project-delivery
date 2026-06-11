import type { Row, Cell } from 'exceljs';
import type { AcceptedRow } from './types';
import { MAX_ISO_WEEKS, WEEK_FLAG_BYTES } from './types';
import { mapStatus } from './status-mapper';

export interface ColumnLayout {
  projectId: number;
  projectName: number;
  projectStatus: number;
  responsible: number | null;
  notes: number | null;
  pm: number | null;
  responsibleDetail: number | null;
  weekColumns: (number | null)[]; // index = isoWeek - 1, length = MAX_ISO_WEEKS
}

export interface RowMapError {
  reason: string;
}

const OK_VALUES = new Set(['ok']);

function readString(cell: Cell | undefined): string | null {
  if (!cell) return null;
  const value = cell.value;
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && 'text' in value) {
    return (value as { text: string }).text?.trim() || null;
  }
  if (typeof value === 'object' && 'richText' in value) {
    const parts = (value as { richText: { text: string }[] }).richText
      .map((r) => r.text)
      .join('');
    return parts.trim() || null;
  }
  return String(value).trim() || null;
}

export function mapRow(
  row: Row,
  rowNumber: number,
  layout: ColumnLayout,
): AcceptedRow | RowMapError {
  const projectId = readString(row.getCell(layout.projectId));
  const projectName = readString(row.getCell(layout.projectName));
  const rawStatus = readString(row.getCell(layout.projectStatus));

  if (!projectId) return { reason: 'Project ID is empty' };
  if (!projectName) return { reason: 'Project Name is empty' };
  if (!rawStatus) return { reason: 'Status Projeto is empty' };

  let projectStatus;
  try {
    projectStatus = mapStatus(rawStatus);
  } catch (err) {
    return { reason: `Unknown Status Projeto: "${rawStatus}"` };
  }

  const weekFlags = Buffer.alloc(WEEK_FLAG_BYTES, 0);
  let weeksSent = 0;
  let firstActiveWeek: number | null = null;
  let lastSentWeek: number | null = null;

  for (let week = 1; week <= MAX_ISO_WEEKS; week++) {
    const columnIdx = layout.weekColumns[week - 1];
    if (columnIdx === null || columnIdx === undefined) continue;
    const raw = readString(row.getCell(columnIdx));
    if (raw === null) continue;
    if (!OK_VALUES.has(raw.toLowerCase())) {
      return {
        reason: `Invalid value "${raw}" at week ${week}; expected "ok" or blank`,
      };
    }
    const byteIdx = Math.floor((week - 1) / 8);
    const bit = (week - 1) % 8;
    weekFlags[byteIdx] = (weekFlags[byteIdx] ?? 0) | (1 << bit);
    weeksSent++;
    if (firstActiveWeek === null) firstActiveWeek = week;
    lastSentWeek = week;
  }

  return {
    rowNumber,
    projectId,
    projectName,
    projectStatus,
    responsible:
      layout.responsible !== null
        ? readString(row.getCell(layout.responsible))
        : null,
    responsibleDetail:
      layout.responsibleDetail !== null
        ? readString(row.getCell(layout.responsibleDetail))
        : null,
    pm: layout.pm !== null ? readString(row.getCell(layout.pm)) : null,
    notes:
      layout.notes !== null ? readString(row.getCell(layout.notes)) : null,
    weekFlags,
    weeksSent,
    firstActiveWeek,
    lastSentWeek,
  };
}

export function isRowMapError(value: AcceptedRow | RowMapError): value is RowMapError {
  return 'reason' in value && !('projectId' in value);
}
