import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/infrastructure/database/prisma.module';
import { JwtAuthGuard } from './shared/infrastructure/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { StatusReportsModule } from './modules/status-reports/status-reports.module';
import { StatusReportGoalsModule } from './modules/status-report-goals/status-report-goals.module';
import { StorageModule } from './shared/infrastructure/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    StatusReportsModule,
    StatusReportGoalsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
