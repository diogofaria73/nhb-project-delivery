import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { ChangePasswordDto } from '../dtos/change-password.dto';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.newPassword !== dto.newPasswordConfirmation) {
      throw new BadRequestException('Password confirmation does not match');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    user.updatePassword(hashedPassword);

    // Auto-activate users completing the mandatory first-login change.
    if (user.mustChangePassword) {
      user.clearPasswordChangeRequirement();
      if (!user.isActive) {
        user.activate();
      }
    }

    await this.userRepository.update(user);
  }
}
