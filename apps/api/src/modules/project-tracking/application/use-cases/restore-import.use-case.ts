import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import {
  IProjectImportRepository,
  PROJECT_IMPORT_REPOSITORY,
} from '../../domain/repositories/project-import.repository';
import {
  ImportNotFoundError,
  ImportNotRestorableError,
} from '../../domain/errors/project-tracking.errors';

@Injectable()
export class RestoreImportUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PROJECT_IMPORT_REPOSITORY)
    private readonly repository: IProjectImportRepository,
  ) {}

  async execute(importId: string): Promise<void> {
    const target = await this.repository.findById(importId);
    if (!target) throw new ImportNotFoundError(importId);
    if (target.status !== 'SUPERSEDED') throw new ImportNotRestorableError();

    await this.prisma.$transaction(async (tx) => {
      const currentActive = await tx.projectImport.findFirst({
        where: { referenceYear: target.referenceYear, status: 'ACTIVE' },
      });
      if (currentActive) {
        await tx.projectImport.update({
          where: { id: currentActive.id },
          data: { status: 'SUPERSEDED' },
        });
      }
      await tx.projectImport.update({
        where: { id: importId },
        data: { status: 'ACTIVE' },
      });
    });
  }
}
