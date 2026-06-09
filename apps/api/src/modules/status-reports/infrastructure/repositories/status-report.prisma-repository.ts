import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import {
  IStatusReportRepository,
  ListedSubmission,
  PaginatedResult,
  PaginationOptions,
  SubmissionFilters,
} from '../../domain/repositories/status-report.repository';
import {
  StatusReportSubmission,
  SubmissionStatus,
} from '../../domain/entities/status-report-submission.entity';
import { StatusReportAttachment } from '../../domain/entities/status-report-attachment.entity';

@Injectable()
export class StatusReportPrismaRepository implements IStatusReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ListedSubmission | null> {
    const record = await this.prisma.statusReportSubmission.findUnique({
      where: { id },
      include: {
        company: true,
        submittedBy: true,
        attachments: true,
      },
    });
    if (!record) return null;
    return this.toListed(record);
  }

  async findAttachmentById(
    submissionId: string,
    attachmentId: string,
  ): Promise<StatusReportAttachment | null> {
    const record = await this.prisma.statusReportAttachment.findFirst({
      where: { id: attachmentId, submissionId },
    });
    if (!record) return null;
    return new StatusReportAttachment({
      id: record.id,
      submissionId: record.submissionId,
      filename: record.filename,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      storageKey: record.storageKey,
      uploadedAt: record.uploadedAt,
    });
  }

  async findAll(
    filters: SubmissionFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<ListedSubmission>> {
    const where: Prisma.StatusReportSubmissionWhereInput = {};

    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.submittedById) where.submittedById = filters.submittedById;

    if (filters.from || filters.to) {
      where.referenceMonth = {};
      if (filters.from) where.referenceMonth.gte = filters.from;
      if (filters.to) where.referenceMonth.lte = filters.to;
    }

    if (filters.search) {
      where.OR = [
        { deliveryEmail: { contains: filters.search, mode: 'insensitive' } },
        { company: { tradeName: { contains: filters.search, mode: 'insensitive' } } },
        { company: { legalName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.statusReportSubmission.findMany({
        where,
        include: { company: true, submittedBy: true, attachments: true },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.statusReportSubmission.count({ where }),
    ]);

    let mapped = records.map((r) => this.toListed(r));

    if (filters.status) {
      mapped = mapped.filter((m) => m.submission.status === (filters.status as SubmissionStatus));
    }

    return {
      data: mapped,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async findAllForSummary(filters: {
    companyId?: string;
    from?: Date;
    to?: Date;
  }): Promise<Array<{ submittedAt: Date; referenceMonth: Date; companyId: string }>> {
    const where: Prisma.StatusReportSubmissionWhereInput = {};
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.from || filters.to) {
      where.referenceMonth = {};
      if (filters.from) where.referenceMonth.gte = filters.from;
      if (filters.to) where.referenceMonth.lte = filters.to;
    }
    return this.prisma.statusReportSubmission.findMany({
      where,
      select: {
        submittedAt: true,
        referenceMonth: true,
        companyId: true,
      },
    });
  }

  async create(submission: StatusReportSubmission): Promise<StatusReportSubmission> {
    await this.prisma.$transaction(async (tx) => {
      await tx.statusReportSubmission.create({
        data: {
          id: submission.id,
          companyId: submission.companyId,
          referenceMonth: submission.referenceMonth,
          deliveryEmail: submission.deliveryEmail,
          notes: submission.notes,
          submittedById: submission.submittedById,
        },
      });
      if (submission.attachments.length > 0) {
        await tx.statusReportAttachment.createMany({
          data: submission.attachments.map((a) => ({
            id: a.id,
            submissionId: submission.id,
            filename: a.filename,
            mimeType: a.mimeType,
            sizeBytes: a.sizeBytes,
            storageKey: a.storageKey,
          })),
        });
      }
    });
    return submission;
  }

  async update(submission: StatusReportSubmission): Promise<StatusReportSubmission> {
    await this.prisma.statusReportSubmission.update({
      where: { id: submission.id },
      data: {
        referenceMonth: submission.referenceMonth,
        deliveryEmail: submission.deliveryEmail,
        notes: submission.notes,
      },
    });
    return submission;
  }

  async delete(submissionId: string): Promise<StatusReportAttachment[]> {
    const attachments = await this.prisma.statusReportAttachment.findMany({
      where: { submissionId },
    });
    await this.prisma.statusReportSubmission.delete({ where: { id: submissionId } });
    return attachments.map(
      (a) =>
        new StatusReportAttachment({
          id: a.id,
          submissionId: a.submissionId,
          filename: a.filename,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          storageKey: a.storageKey,
          uploadedAt: a.uploadedAt,
        }),
    );
  }

  private toListed(record: {
    id: string;
    companyId: string;
    referenceMonth: Date;
    deliveryEmail: string;
    notes: string | null;
    submittedById: string;
    submittedAt: Date;
    updatedAt: Date;
    company: { tradeName: string; legalName: string; cnpj: string };
    submittedBy: { name: string };
    attachments: Array<{
      id: string;
      submissionId: string;
      filename: string;
      mimeType: string;
      sizeBytes: number;
      storageKey: string;
      uploadedAt: Date;
    }>;
  }): ListedSubmission {
    const attachments = record.attachments.map(
      (a) =>
        new StatusReportAttachment({
          id: a.id,
          submissionId: a.submissionId,
          filename: a.filename,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          storageKey: a.storageKey,
          uploadedAt: a.uploadedAt,
        }),
    );

    const submission = new StatusReportSubmission({
      id: record.id,
      companyId: record.companyId,
      referenceMonth: record.referenceMonth,
      deliveryEmail: record.deliveryEmail,
      notes: record.notes,
      submittedById: record.submittedById,
      submittedAt: record.submittedAt,
      updatedAt: record.updatedAt,
      attachments,
    });

    return {
      submission,
      companyTradeName: record.company.tradeName,
      companyLegalName: record.company.legalName,
      companyCnpj: record.company.cnpj,
      submittedByName: record.submittedBy.name,
    };
  }
}
