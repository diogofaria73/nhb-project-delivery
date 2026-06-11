import * as path from 'path';
import * as fs from 'fs';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PrismaModule } from './shared/infrastructure/database/prisma.module';
import { JwtAuthGuard } from './shared/infrastructure/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectTrackingModule } from './modules/project-tracking/project-tracking.module';
import { StorageModule } from './shared/infrastructure/storage/storage.module';

const WEB_BUILD_PATH =
  process.env.WEB_BUILD_PATH ?? path.resolve(__dirname, '..', '..', 'web-dist');
const WEB_BUILD_EXISTS = fs.existsSync(WEB_BUILD_PATH);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ...(WEB_BUILD_EXISTS
      ? [
          ServeStaticModule.forRoot({
            rootPath: WEB_BUILD_PATH,
            exclude: ['/api/{*splat}'],
            serveStaticOptions: {
              index: 'index.html',
              fallthrough: true,
            },
          }),
        ]
      : []),
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    ProjectTrackingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
