import { Readable } from 'stream';

export const STORAGE_PROVIDER = 'IStorageProvider';

export interface StoredFileMetadata {
  storageKey: string;
}

export interface IStorageProvider {
  /**
   * Persist a buffer under a generated key derived from the originalFilename.
   * Returns the opaque storage key to be persisted in the database.
   */
  save(buffer: Buffer, originalFilename: string, mimeType: string): Promise<StoredFileMetadata>;

  /**
   * Open a readable stream for the given storage key.
   */
  read(storageKey: string): Readable;

  /**
   * Best-effort deletion. Errors must not throw if the key is already gone.
   */
  delete(storageKey: string): Promise<void>;
}
