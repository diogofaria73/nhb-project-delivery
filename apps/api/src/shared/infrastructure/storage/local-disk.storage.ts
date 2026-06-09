import { createReadStream } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { IStorageProvider, StoredFileMetadata } from './storage.interface';

@Injectable()
export class LocalDiskStorage implements IStorageProvider {
  private readonly logger = new Logger(LocalDiskStorage.name);
  private readonly basePath: string;

  constructor(configService: ConfigService) {
    const configured = configService.get<string>('STORAGE_LOCAL_PATH') ?? './storage';
    this.basePath = path.resolve(configured, 'status-reports');
  }

  async save(
    buffer: Buffer,
    originalFilename: string,
    _mimeType: string,
  ): Promise<StoredFileMetadata> {
    const now = new Date();
    const yyyy = now.getUTCFullYear().toString();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');

    const safeName = originalFilename.replace(/[/\\?%*:|"<>]/g, '_');
    const storageKey = path.posix.join(yyyy, mm, `${uuidv4()}-${safeName}`);
    const absolutePath = path.join(this.basePath, storageKey);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);

    return { storageKey };
  }

  read(storageKey: string): Readable {
    const absolutePath = path.join(this.basePath, storageKey);
    return createReadStream(absolutePath);
  }

  async delete(storageKey: string): Promise<void> {
    const absolutePath = path.join(this.basePath, storageKey);
    try {
      await unlink(absolutePath);
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code !== 'ENOENT') {
        this.logger.warn(`Failed to delete stored file ${storageKey}: ${error.message}`);
      }
    }
  }
}
