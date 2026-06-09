import { Global, Module } from '@nestjs/common';
import { LocalDiskStorage } from './local-disk.storage';
import { STORAGE_PROVIDER } from './storage.interface';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useClass: LocalDiskStorage,
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
