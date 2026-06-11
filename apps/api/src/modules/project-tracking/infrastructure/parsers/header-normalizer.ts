export function normalizeHeader(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const CANONICAL_HEADERS = {
  projectId: 'project id',
  projectName: 'project name',
  projectStatus: 'status projeto',
  responsible: 'responsavel pelo envio',
  notes: 'obs',
  pm: 'pm',
  responsibleDetail: 'detal. resp. envio',
} as const;

export const REQUIRED_HEADERS: readonly string[] = [
  CANONICAL_HEADERS.projectId,
  CANONICAL_HEADERS.projectName,
  CANONICAL_HEADERS.projectStatus,
];

export function weekHeader(week: number): string {
  return `semana ${week}`;
}
