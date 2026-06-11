import type { Worksheet } from 'exceljs';
import type { BiSanityDiff } from '@nhb-status-report/shared';
import type { AcceptedRow } from './types';
import { MAX_ISO_WEEKS } from './types';
import { normalizeHeader } from './header-normalizer';

const TARGET_HEADERS: Record<string, string> = {
  'projetos concluidos %': 'completedPct',
  'projetos cancelados %': 'cancelledPct',
  'projetos on hold %': 'onHoldPct',
  'a iniciar %': 'notStartedPct',
  ativos: 'active',
  'status enviados': 'totalSent',
};

function bitAt(buffer: Buffer, week: number): boolean {
  const byteIdx = Math.floor((week - 1) / 8);
  const bit = (week - 1) % 8;
  if (byteIdx >= buffer.length) return false;
  return ((buffer[byteIdx] ?? 0) & (1 << bit)) !== 0;
}

export function computeBiSanity(
  biSheet: Worksheet | undefined,
  acceptedRows: AcceptedRow[],
): BiSanityDiff {
  if (!biSheet) {
    return {
      available: false,
      warnings: ['Sheet "BI" not found in the workbook — sanity-check skipped'],
    };
  }

  const headerRow = biSheet.getRow(1);
  const headerToCol = new Map<string, number>();
  headerRow.eachCell((cell, colNumber) => {
    const normalized = normalizeHeader(
      typeof cell.value === 'string' ? cell.value : String(cell.value ?? ''),
    );
    const targetKey = TARGET_HEADERS[normalized];
    if (targetKey) {
      headerToCol.set(targetKey, colNumber);
    }
    const weekMatch = normalized.match(/^semana (\d+)$/);
    if (weekMatch && weekMatch[1]) {
      headerToCol.set(`week-${weekMatch[1]}`, colNumber);
    }
  });

  const valueRow = biSheet.getRow(2);
  const readNumber = (key: string): number | null => {
    const col = headerToCol.get(key);
    if (!col) return null;
    const raw = valueRow.getCell(col).value;
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string' && raw.trim() !== '') {
      const parsed = Number(raw.replace('%', '').trim());
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const totals = {
    active: acceptedRows.filter((r) => r.projectStatus === 'ACTIVE').length,
    completed: acceptedRows.filter((r) => r.projectStatus === 'COMPLETED').length,
    cancelled: acceptedRows.filter((r) => r.projectStatus === 'CANCELLED').length,
    onHold: acceptedRows.filter((r) => r.projectStatus === 'ON_HOLD').length,
    notStarted: acceptedRows.filter((r) => r.projectStatus === 'NOT_STARTED').length,
    totalSent: acceptedRows.reduce((sum, r) => sum + r.weeksSent, 0),
  };
  const totalProjects = acceptedRows.length;
  const pct = (n: number) => (totalProjects > 0 ? n / totalProjects : 0);

  const warnings: string[] = [];

  const compare = (
    label: string,
    biValue: number | null,
    computedValue: number,
    toleranceUnits: number,
  ) => {
    if (biValue === null) return;
    if (Math.abs(biValue - computedValue) > toleranceUnits) {
      warnings.push(
        `${label}: BI = ${biValue}, computed = ${computedValue}`,
      );
    }
  };

  compare('Ativos', readNumber('active'), totals.active, 0.5);
  compare('Status Enviados', readNumber('totalSent'), totals.totalSent, 0.5);
  compare('Projetos Concluídos %', readNumber('completedPct'), pct(totals.completed), 0.01);
  compare('Projetos Cancelados %', readNumber('cancelledPct'), pct(totals.cancelled), 0.01);
  compare('Projetos On Hold %', readNumber('onHoldPct'), pct(totals.onHold), 0.01);
  compare('A Iniciar %', readNumber('notStartedPct'), pct(totals.notStarted), 0.01);

  // Per-week BI row (the spreadsheet keeps absolute counts on row 7).
  const row7 = biSheet.getRow(7);
  for (let week = 1; week <= MAX_ISO_WEEKS; week++) {
    const col = headerToCol.get(`week-${week}`);
    if (!col) continue;
    const cellValue = row7.getCell(col).value;
    if (typeof cellValue !== 'number') continue;
    const computed = acceptedRows.reduce(
      (sum, r) => sum + (bitAt(r.weekFlags, week) ? 1 : 0),
      0,
    );
    if (Math.abs(cellValue - computed) > 0.5) {
      warnings.push(`Semana ${week}: BI = ${cellValue}, computed = ${computed}`);
    }
  }

  return { available: true, warnings };
}
