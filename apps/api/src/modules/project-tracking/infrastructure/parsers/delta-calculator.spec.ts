import type { AcceptedRow } from './types';
import { calculateDelta, PreviousSnapshotRef } from './delta-calculator';

function flagsWithWeeks(weeks: number[]): Buffer {
  const buf = Buffer.alloc(8, 0);
  for (const week of weeks) {
    const byteIdx = Math.floor((week - 1) / 8);
    const bit = (week - 1) % 8;
    buf[byteIdx] = (buf[byteIdx] ?? 0) | (1 << bit);
  }
  return buf;
}

function acceptedRow(
  projectId: string,
  status: AcceptedRow['projectStatus'],
  weeks: number[],
): AcceptedRow {
  return {
    rowNumber: 1,
    projectId,
    projectName: `Project ${projectId}`,
    projectStatus: status,
    responsible: null,
    responsibleDetail: null,
    pm: null,
    notes: null,
    weekFlags: flagsWithWeeks(weeks),
    weeksSent: weeks.length,
    firstActiveWeek: weeks[0] ?? null,
    lastSentWeek: weeks[weeks.length - 1] ?? null,
  };
}

function previousRef(
  projectId: string,
  status: AcceptedRow['projectStatus'],
  weeks: number[],
): PreviousSnapshotRef {
  return {
    projectId,
    projectName: `Project ${projectId}`,
    projectStatus: status,
    weekFlags: flagsWithWeeks(weeks),
  };
}

describe('calculateDelta', () => {
  it('returns "no previous" when previous is null', () => {
    const delta = calculateDelta([acceptedRow('A', 'ACTIVE', [1])], null);
    expect(delta.hasPrevious).toBe(false);
    expect(delta.addedProjects).toHaveLength(0);
    expect(delta.weeklyOksAdded.every((n) => n === 0)).toBe(true);
  });

  it('detects added projects', () => {
    const delta = calculateDelta(
      [acceptedRow('A', 'ACTIVE', [1]), acceptedRow('B', 'ACTIVE', [])],
      [previousRef('A', 'ACTIVE', [1])],
    );
    expect(delta.hasPrevious).toBe(true);
    expect(delta.addedProjects.map((p) => p.projectId)).toEqual(['B']);
    expect(delta.removedProjects).toHaveLength(0);
  });

  it('detects removed projects and accounts for their previous OKs', () => {
    const delta = calculateDelta(
      [acceptedRow('A', 'ACTIVE', [1])],
      [
        previousRef('A', 'ACTIVE', [1]),
        previousRef('B', 'ACTIVE', [1, 2]),
      ],
    );
    expect(delta.removedProjects.map((p) => p.projectId)).toEqual(['B']);
    expect(delta.weeklyOksRemoved[0]).toBe(1); // week 1 had B
    expect(delta.weeklyOksRemoved[1]).toBe(1); // week 2 had B
  });

  it('detects status changes', () => {
    const delta = calculateDelta(
      [acceptedRow('A', 'ON_HOLD', [])],
      [previousRef('A', 'ACTIVE', [])],
    );
    expect(delta.statusChanges).toHaveLength(1);
    expect(delta.statusChanges[0]).toMatchObject({
      projectId: 'A',
      from: 'ACTIVE',
      to: 'ON_HOLD',
    });
  });

  it('detects weekly OK additions and removals on the same project', () => {
    const delta = calculateDelta(
      [acceptedRow('A', 'ACTIVE', [1, 3])],
      [previousRef('A', 'ACTIVE', [1, 2])],
    );
    expect(delta.weeklyOksAdded[2]).toBe(1); // week 3 added
    expect(delta.weeklyOksRemoved[1]).toBe(1); // week 2 removed
    expect(delta.weeklyOksAdded[0]).toBe(0); // week 1 unchanged
  });
});
