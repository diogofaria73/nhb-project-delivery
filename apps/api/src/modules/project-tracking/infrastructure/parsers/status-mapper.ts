import type { ProjectStatus } from '@nhb-status-report/shared';
import { normalizeHeader } from './header-normalizer';

const STATUS_MAP: Record<string, ProjectStatus> = {
  ativo: 'ACTIVE',
  'on hold': 'ON_HOLD',
  concluido: 'COMPLETED',
  cancelado: 'CANCELLED',
  'a iniciar': 'NOT_STARTED',
};

export class UnknownStatusError extends Error {
  constructor(public readonly raw: string) {
    super(`Unknown project status: "${raw}"`);
    this.name = 'UnknownStatusError';
  }
}

export function mapStatus(raw: string | null | undefined): ProjectStatus {
  const normalized = normalizeHeader(raw);
  const mapped = STATUS_MAP[normalized];
  if (!mapped) throw new UnknownStatusError(raw?.toString() ?? '');
  return mapped;
}

export const ACTIVE_STATUSES: ReadonlySet<ProjectStatus> = new Set(['ACTIVE']);
export const CLOSED_STATUSES: ReadonlySet<ProjectStatus> = new Set([
  'COMPLETED',
  'CANCELLED',
]);
