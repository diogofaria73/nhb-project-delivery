import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, PaginatedResult, USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { ListUsersQueryDto } from '../dtos/list-users-query.dto';
import { UserResponseDto } from '../dtos/user-response.dto';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: ListUsersQueryDto): Promise<PaginatedResult<UserResponseDto>> {
    const result = await this.userRepository.findAll(
      {
        role: query.role,
        isActive: query.isActive,
        search: query.search,
      },
      {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      },
    );

    return {
      data: result.data.map(UserResponseDto.fromEntity),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
