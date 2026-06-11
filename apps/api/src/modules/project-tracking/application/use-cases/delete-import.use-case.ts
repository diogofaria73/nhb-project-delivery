import { Inject, Injectable } from '@nestjs/common';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
} from '@shared/infrastructure/storage/storage.interface';
import {
  IProjectImportRepository,
  PROJECT_IMPORT_REPOSITORY,
} from '../../domain/repositories/project-import.repository';
import {
  CannotDeleteActiveImportError,
  ImportNotFoundError,
} from '../../domain/errors/project-tracking.errors';

@Injectable()
export class DeleteImportUseCase {
  constructor(
    @Inject(PROJECT_IMPORT_REPOSITORY)
    private readonly repository: IProjectImportRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async execute(importId: string): Promise<void> {
    const record = await this.repository.findById(importId);
    if (!record) throw new ImportNotFoundError(importId);
    if (record.status === 'ACTIVE') throw new CannotDeleteActiveImportError();

    await this.repository.delete(importId);
    await this.storage.delete(record.storageKey).catch(() => undefined);
  }
}
