import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ChangePasswordUseCase } from './change-password.use-case';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { IUserRepository } from '../../domain/repositories/user.repository';

jest.mock('bcrypt');

function makeUser(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
  return new User({
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-current-password',
    role: UserRole.USER,
    ...overrides,
  });
}

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn().mockImplementation(async (user) => user),
      countActiveAdmins: jest.fn(),
    };
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');

    useCase = new ChangePasswordUseCase(userRepository);
  });

  it('should change password successfully', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await useCase.execute('user-1', {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
      newPasswordConfirmation: 'NewPassword123!',
    });

    expect(user.password).toBe('hashed-new-password');
    expect(userRepository.update).toHaveBeenCalledWith(user);
    expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 12);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', {
        currentPassword: 'any',
        newPassword: 'any',
        newPasswordConfirmation: 'any',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw UnauthorizedException when current password is wrong', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      useCase.execute('user-1', {
        currentPassword: 'WrongPassword!',
        newPassword: 'NewPassword123!',
        newPasswordConfirmation: 'NewPassword123!',
      }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      useCase.execute('user-1', {
        currentPassword: 'WrongPassword!',
        newPassword: 'NewPassword123!',
        newPasswordConfirmation: 'NewPassword123!',
      }),
    ).rejects.toThrow('Current password is incorrect');
  });

  it('should throw BadRequestException when confirmation does not match', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      useCase.execute('user-1', {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        newPasswordConfirmation: 'DifferentPassword!',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      useCase.execute('user-1', {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        newPasswordConfirmation: 'DifferentPassword!',
      }),
    ).rejects.toThrow('Password confirmation does not match');
  });
});
