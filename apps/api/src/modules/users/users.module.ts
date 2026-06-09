import { Module } from '@nestjs/common';
import { UsersController } from './presentation/controllers/users.controller';
import { UserPrismaRepository } from './infrastructure/repositories/user.prisma-repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import {
  CreateUserUseCase,
  UpdateUserUseCase,
  ListUsersUseCase,
  FindUserUseCase,
  ToggleUserStatusUseCase,
  UnlockUserUseCase,
  ChangePasswordUseCase,
} from './application/use-cases';

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserPrismaRepository,
    },
    CreateUserUseCase,
    UpdateUserUseCase,
    ListUsersUseCase,
    FindUserUseCase,
    ToggleUserStatusUseCase,
    UnlockUserUseCase,
    ChangePasswordUseCase,
  ],
  exports: [USER_REPOSITORY, FindUserUseCase],
})
export class UsersModule {}
