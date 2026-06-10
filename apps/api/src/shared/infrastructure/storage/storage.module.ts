import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureBlobStorage } from './azure-blob.storage';
import { LocalDiskStorage } from './local-disk.storage';
import { IStorageProvider, STORAGE_PROVIDER } from './storage.interface';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): IStorageProvider => {
        const driver = config.get<string>('STORAGE_DRIVER') ?? 'local';
        if (driver === 'azure-blob') {
          return new AzureBlobStorage(config);
        }
        return new LocalDiskStorage(config);
      },
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
