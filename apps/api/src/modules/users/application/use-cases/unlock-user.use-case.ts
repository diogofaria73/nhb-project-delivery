import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { UserResponseDto } from '../dtos/user-response.dto';

@Injectable()
export class UnlockUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.unlock();

    const updatedUser = await this.userRepository.update(user);
    return UserResponseDto.fromEntity(updatedUser);
  }
}
