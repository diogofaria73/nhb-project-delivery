import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { UserResponseDto } from '../dtos/user-response.dto';

@Injectable()
export class ToggleUserStatusUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string, requestingUserId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // BR-11: Admin cannot deactivate their own account
    if (id === requestingUserId) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    if (user.isActive) {
      // BR-12: Must always have at least one active admin
      if (user.isAdministrator) {
        const activeAdminCount = await this.userRepository.countActiveAdmins();
        if (activeAdminCount <= 1) {
          throw new ForbiddenException(
            'Cannot deactivate the last active administrator',
          );
        }
      }
      user.deactivate();
    } else {
      user.activate();
    }

    const updatedUser = await this.userRepository.update(user);
    return UserResponseDto.fromEntity(updatedUser);
  }
}
