import { Readable } from 'stream';
import { Inject, Injectable } from '@nestjs/common';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
} from '@shared/infrastructure/storage/storage.interface';
import {
  IProjectImportRepository,
  PROJECT_IMPORT_REPOSITORY,
} from '../../domain/repositories/project-import.repository';
import { ImportNotFoundError } from '../../domain/errors/project-tracking.errors';

export interface DownloadImportFileResult {
  stream: Readable;
  originalFilename: string;
  fileSizeBytes: number;
}

@Injectable()
export class DownloadImportFileUseCase {
  constructor(
    @Inject(PROJECT_IMPORT_REPOSITORY)
    private readonly repository: IProjectImportRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async execute(id: string): Promise<DownloadImportFileResult> {
    const record = await this.repository.findById(id);
    if (!record) throw new ImportNotFoundError(id);
    return {
      stream: this.storage.read(record.storageKey),
      originalFilename: record.originalFilename,
      fileSizeBytes: record.fileSizeBytes,
    };
  }
}
