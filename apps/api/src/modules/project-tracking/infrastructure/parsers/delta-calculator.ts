import type { ParseDelta, ProjectStatus } from '@nhb-status-report/shared';
import type { AcceptedRow } from './types';
import { MAX_ISO_WEEKS } from './types';

export interface PreviousSnapshotRef {
  projectId: string;
  projectName: string;
  projectStatus: ProjectStatus;
  weekFlags: Buffer;
}

function bitAt(buffer: Buffer, week: number): boolean {
  const byteIdx = Math.floor((week - 1) / 8);
  const bit = (week - 1) % 8;
  if (byteIdx >= buffer.length) return false;
  return ((buffer[byteIdx] ?? 0) & (1 << bit)) !== 0;
}

export function calculateDelta(
  acceptedRows: AcceptedRow[],
  previous: PreviousSnapshotRef[] | null,
): ParseDelta {
  if (!previous) {
    return {
      hasPrevious: false,
      addedProjects: [],
      removedProjects: [],
      statusChanges: [],
      weeklyOksAdded: new Array(MAX_ISO_WEEKS).fill(0),
      weeklyOksRemoved: new Array(MAX_ISO_WEEKS).fill(0),
    };
  }

  const prevByProjectId = new Map(previous.map((p) => [p.projectId, p]));
  const prevByName = new Map(previous.map((p) => [p.projectName, p]));
  const newByProjectId = new Map(acceptedRows.map((r) => [r.projectId, r]));
  const newByName = new Map(acceptedRows.map((r) => [r.projectName, r]));

  // Tolerate the transition where a row that previously had no Project ID
  // (and was stored with its name as the id) now arrives with a real ID —
  // fall back to a name match so it is not reported as remove+add.
  const findPrev = (r: AcceptedRow) =>
    prevByProjectId.get(r.projectId) ?? prevByName.get(r.projectName) ?? null;
  const hasNewMatch = (p: PreviousSnapshotRef) =>
    newByProjectId.has(p.projectId) || newByName.has(p.projectName);

  const addedProjects = acceptedRows
    .filter((r) => findPrev(r) === null)
    .map((r) => ({ projectId: r.projectId, projectName: r.projectName }));

  const removedProjects = previous
    .filter((p) => !hasNewMatch(p))
    .map((p) => ({ projectId: p.projectId, projectName: p.projectName }));

  const statusChanges = acceptedRows
    .filter((r) => {
      const prev = findPrev(r);
      return prev !== null && prev.projectStatus !== r.projectStatus;
    })
    .map((r) => {
      const prev = findPrev(r)!;
      return {
        projectId: r.projectId,
        projectName: r.projectName,
        from: prev.projectStatus,
        to: r.projectStatus,
      };
    });

  const weeklyOksAdded = new Array(MAX_ISO_WEEKS).fill(0);
  const weeklyOksRemoved = new Array(MAX_ISO_WEEKS).fill(0);

  for (const row of acceptedRows) {
    const prev = findPrev(row);
    for (let week = 1; week <= MAX_ISO_WEEKS; week++) {
      const nowSet = bitAt(row.weekFlags, week);
      const prevSet = prev ? bitAt(prev.weekFlags, week) : false;
      if (nowSet && !prevSet) weeklyOksAdded[week - 1]++;
      if (!nowSet && prevSet) weeklyOksRemoved[week - 1]++;
    }
  }

  // Account for OK marks lost because the whole project was removed.
  for (const prev of previous) {
    if (hasNewMatch(prev)) continue;
    for (let week = 1; week <= MAX_ISO_WEEKS; week++) {
      if (bitAt(prev.weekFlags, week)) weeklyOksRemoved[week - 1]++;
    }
  }

  return {
    hasPrevious: true,
    addedProjects,
    removedProjects,
    statusChanges,
    weeklyOksAdded,
    weeklyOksRemoved,
  };
}
