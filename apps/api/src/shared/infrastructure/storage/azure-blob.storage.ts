import { Readable } from 'stream';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { IStorageProvider, StoredFileMetadata } from './storage.interface';

@Injectable()
export class AzureBlobStorage implements IStorageProvider {
  private readonly logger = new Logger(AzureBlobStorage.name);
  private readonly container: ContainerClient;

  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('AZURE_STORAGE_CONNECTION_STRING');
    const containerName =
      configService.get<string>('AZURE_STORAGE_CONTAINER') ?? 'status-reports';

    if (!connectionString) {
      throw new Error(
        'AZURE_STORAGE_CONNECTION_STRING is required when STORAGE_DRIVER=azure-blob',
      );
    }

    const service = BlobServiceClient.fromConnectionString(connectionString);
    this.container = service.getContainerClient(containerName);
  }

  async save(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
  ): Promise<StoredFileMetadata> {
    const now = new Date();
    const yyyy = now.getUTCFullYear().toString();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');

    const safeName = originalFilename.replace(/[/\\?%*:|"<>]/g, '_');
    const storageKey = `${yyyy}/${mm}/${uuidv4()}-${safeName}`;

    const blob = this.container.getBlockBlobClient(storageKey);
    await blob.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });

    return { storageKey };
  }

  read(storageKey: string): Readable {
    const blob = this.container.getBlockBlobClient(storageKey);
    // Return a passthrough stream that resolves to the blob's readable stream.
    const pass = new Readable({ read() {} });
    blob
      .download()
      .then((res) => {
        const src = res.readableStreamBody as NodeJS.ReadableStream | undefined;
        if (!src) {
          pass.emit('error', new Error(`No readable body for blob ${storageKey}`));
          return;
        }
        src.on('data', (chunk) => pass.push(chunk));
        src.on('end', () => pass.push(null));
        src.on('error', (err) => pass.emit('error', err));
      })
      .catch((err) => pass.emit('error', err));
    return pass;
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await this.container.deleteBlob(storageKey);
    } catch (err) {
      const error = err as { statusCode?: number; message?: string };
      if (error.statusCode !== 404) {
        this.logger.warn(`Failed to delete blob ${storageKey}: ${error.message}`);
      }
    }
  }
}
