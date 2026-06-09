import { Readable } from 'stream';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IStatusReportRepository,
  STATUS_REPORT_REPOSITORY,
} from '../../domain/repositories/status-report.repository';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
} from '@shared/infrastructure/storage/storage.interface';

export interface AttachmentDownload {
  stream: Readable;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

@Injectable()
export class DownloadAttachmentUseCase {
  constructor(
    @Inject(STATUS_REPORT_REPOSITORY)
    private readonly repository: IStatusReportRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
  ) {}

  async execute(submissionId: string, attachmentId: string): Promise<AttachmentDownload> {
    const attachment = await this.repository.findAttachmentById(submissionId, attachmentId);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    return {
      stream: this.storage.read(attachment.storageKey),
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
    };
  }
}
