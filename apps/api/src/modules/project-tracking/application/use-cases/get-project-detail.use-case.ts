import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ProjectDetailResponseDto,
  ProjectWeekCellDto,
} from '@nhb-status-report/shared';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { IsoWeekService } from '../../domain/services/iso-week.service';

@Injectable()
export class GetProjectDetailUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly isoWeekService: IsoWeekService,
  ) {}

  async execute(snapshotId: string): Promise<ProjectDetailResponseDto> {
    const snapshot = await this.prisma.projectSnapshot.findUnique({
      where: { id: snapshotId },
      include: { import: true },
    });
    if (!snapshot) throw new NotFoundException(`Snapshot not found: ${snapshotId}`);

    const referenceYear = snapshot.import.referenceYear;
    const weeksInYear = this.isoWeekService.weeksInYear(referenceYear);
    const currentWeek = this.isoWeekService.effectiveCurrentWeek(referenceYear);

    const weekCells: ProjectWeekCellDto[] = [];
    for (let week = 1; week <= weeksInYear; week++) {
      const range = this.isoWeekService.weekRange(referenceYear, week);
      const sent = this.bitAt(snapshot.weekFlags, week);
      const expected = this.isExpected(snapshot, week, currentWeek);
      weekCells.push({
        isoWeek: week,
        weekStart: range.weekStart.toISOString(),
        weekEnd: range.weekEnd.toISOString(),
        sent,
        expected,
      });
    }

    const compliancePercent =
      snapshot.weeksExpected > 0
        ? Math.round((snapshot.weeksSent / snapshot.weeksExpected) * 10000) / 100
        : null;

    return {
      snapshotId: snapshot.id,
      projectId: snapshot.projectId,
      projectName: snapshot.projectName,
      projectStatus: snapshot.projectStatus,
      pm: snapshot.pm,
      responsible: snapshot.responsible,
      responsibleDetail: snapshot.responsibleDetail,
      notes: snapshot.notes,
      weekFlagsBase64: Buffer.from(snapshot.weekFlags).toString('base64'),
      weeksSent: snapshot.weeksSent,
      weeksExpected: snapshot.weeksExpected,
      compliancePercent,
      firstActiveWeek: snapshot.firstActiveWeek,
      lastSentWeek: snapshot.lastSentWeek,
      importId: snapshot.importId,
      referenceYear,
      weekCells,
    };
  }

  private bitAt(buffer: Buffer | Uint8Array, week: number): boolean {
    const byteIdx = Math.floor((week - 1) / 8);
    const bit = (week - 1) % 8;
    if (byteIdx >= buffer.length) return false;
    return ((buffer[byteIdx] ?? 0) & (1 << bit)) !== 0;
  }

  private isExpected(
    snapshot: { projectStatus: string; firstActiveWeek: number | null },
    week: number,
    currentWeek: number,
  ): boolean {
    if (snapshot.projectStatus !== 'ACTIVE') return false;
    if (week > currentWeek) return false;
    const first = snapshot.firstActiveWeek ?? 1;
    return week >= first;
  }
}
