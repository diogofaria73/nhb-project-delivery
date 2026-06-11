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
  const newByProjectId = new Map(acceptedRows.map((r) => [r.projectId, r]));

  const addedProjects = acceptedRows
    .filter((r) => !prevByProjectId.has(r.projectId))
    .map((r) => ({ projectId: r.projectId, projectName: r.projectName }));

  const removedProjects = previous
    .filter((p) => !newByProjectId.has(p.projectId))
    .map((p) => ({ projectId: p.projectId, projectName: p.projectName }));

  const statusChanges = acceptedRows
    .filter((r) => {
      const prev = prevByProjectId.get(r.projectId);
      return prev && prev.projectStatus !== r.projectStatus;
    })
    .map((r) => {
      const prev = prevByProjectId.get(r.projectId)!;
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
    const prev = prevByProjectId.get(row.projectId);
    for (let week = 1; week <= MAX_ISO_WEEKS; week++) {
      const nowSet = bitAt(row.weekFlags, week);
      const prevSet = prev ? bitAt(prev.weekFlags, week) : false;
      if (nowSet && !prevSet) weeklyOksAdded[week - 1]++;
      if (!nowSet && prevSet) weeklyOksRemoved[week - 1]++;
    }
  }

  // Account for OK marks lost because the whole project was removed.
  for (const prev of previous) {
    if (newByProjectId.has(prev.projectId)) continue;
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
