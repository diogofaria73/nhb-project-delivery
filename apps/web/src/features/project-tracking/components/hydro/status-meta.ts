import type { ProjectStatus } from '@nhb-status-report/shared';

export interface StatusMeta {
  status: ProjectStatus;
  color: string;
  i18nKey: `dashboard.status.${ProjectStatus}`;
}

/** Canonical visual order from the HU: Ativo → Concluído → On hold → A iniciar → Cancelado. */
export const STATUS_ORDER: ProjectStatus[] = [
  'ACTIVE',
  'COMPLETED',
  'ON_HOLD',
  'NOT_STARTED',
  'CANCELLED',
];

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  ACTIVE: '#4f9c92',
  COMPLETED: '#c5b9ac',
  ON_HOLD: '#9a6b80',
  NOT_STARTED: '#cf6a55',
  CANCELLED: '#7a828c',
};

/** Index used as a canonical sort key for the Status column. (BR/HU §4.7) */
export function canonicalStatusIndex(status: ProjectStatus): number {
  return STATUS_ORDER.indexOf(status);
}

/** Apply an alpha (0..255) to a hex `#rrggbb` color, returning `#rrggbbaa`. */
export function withAlpha(hex: string, alphaHex: string): string {
  return `${hex}${alphaHex}`;
}
