import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IStatusReportRepository,
  STATUS_REPORT_REPOSITORY,
} from '../../domain/repositories/status-report.repository';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
} from '@shared/infrastructure/storage/storage.interface';

@Injectable()
export class DeleteSubmissionUseCase {
  constructor(
    @Inject(STATUS_REPORT_REPOSITORY)
    private readonly repository: IStatusReportRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
  ) {}

  async execute(id: string): Promise<void> {
    const listed = await this.repository.findById(id);
    if (!listed) {
      throw new NotFoundException('Submission not found');
    }

    const attachments = await this.repository.delete(id);
    await Promise.allSettled(attachments.map((a) => this.storage.delete(a.storageKey)));
  }
}
