import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserResponseDto } from '../dtos/user-response.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateUserDto,
    requestingUserId: string,
    requestingUserRole: string,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isSelf = id === requestingUserId;
    const isRegularUser = requestingUserRole === 'USER';

    // Regular user can only edit their own data
    if (isRegularUser && !isSelf) {
      throw new ForbiddenException('You can only edit your own profile');
    }

    // Regular user cannot change their role
    if (isRegularUser && dto.role) {
      throw new ForbiddenException('You cannot change your own role');
    }

    // BR-09: Admin cannot change their own role
    if (isSelf && dto.role && dto.role !== user.role) {
      throw new ForbiddenException('Cannot change your own profile role');
    }

    if (dto.name) {
      user.updateName(dto.name);
    }

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }
      user.updateEmail(dto.email);
    }

    if (dto.role) {
      user.updateRole(dto.role);
    }

    const updatedUser = await this.userRepository.update(user);
    return UserResponseDto.fromEntity(updatedUser);
  }
}
