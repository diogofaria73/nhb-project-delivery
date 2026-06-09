import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import {
  IUserRepository,
  UserFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findAll(
    filters: UserFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<User>> {
    const where: Prisma.UserWhereInput = {};

    if (filters.role) {
      where.role = filters.role as Role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: records.map((record) => this.toDomain(record)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async create(user: User): Promise<User> {
    const record = await this.prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role as Role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil,
      },
    });
    return this.toDomain(record);
  }

  async update(user: User): Promise<User> {
    const record = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role as Role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil,
      },
    });
    return this.toDomain(record);
  }

  async countActiveAdmins(): Promise<number> {
    return this.prisma.user.count({
      where: { role: 'ADMINISTRATOR', isActive: true },
    });
  }

  private toDomain(record: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    isActive: boolean;
    mustChangePassword: boolean;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User({
      id: record.id,
      name: record.name,
      email: record.email,
      password: record.password,
      role: record.role as UserRole,
      isActive: record.isActive,
      mustChangePassword: record.mustChangePassword,
      failedLoginAttempts: record.failedLoginAttempts,
      lockedUntil: record.lockedUntil,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
