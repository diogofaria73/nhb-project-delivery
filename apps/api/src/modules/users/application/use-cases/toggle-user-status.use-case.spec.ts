import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ToggleUserStatusUseCase } from './toggle-user-status.use-case';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { IUserRepository } from '../../domain/repositories/user.repository';

function makeUser(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
  return new User({
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    role: UserRole.USER,
    isActive: true,
    ...overrides,
  });
}

describe('ToggleUserStatusUseCase', () => {
  let useCase: ToggleUserStatusUseCase;
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

    useCase = new ToggleUserStatusUseCase(userRepository);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('user-1', 'admin-1')).rejects.toThrow(NotFoundException);
  });

  it('should deactivate an active regular user', async () => {
    const user = makeUser({ isActive: true });
    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute('user-1', 'admin-1');

    expect(result.isActive).toBe(false);
    expect(userRepository.update).toHaveBeenCalled();
  });

  it('should activate an inactive user', async () => {
    const user = makeUser({ isActive: false });
    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute('user-1', 'admin-1');

    expect(result.isActive).toBe(true);
  });

  it('should forbid deactivating own account (BR-11)', async () => {
    const admin = makeUser({ id: 'admin-1', role: UserRole.ADMINISTRATOR });
    userRepository.findById.mockResolvedValue(admin);

    await expect(useCase.execute('admin-1', 'admin-1')).rejects.toThrow(ForbiddenException);
    await expect(useCase.execute('admin-1', 'admin-1')).rejects.toThrow(
      'Cannot deactivate your own account',
    );
  });

  it('should forbid deactivating the last active admin (BR-12)', async () => {
    const admin = makeUser({ id: 'admin-2', role: UserRole.ADMINISTRATOR, isActive: true });
    userRepository.findById.mockResolvedValue(admin);
    userRepository.countActiveAdmins.mockResolvedValue(1);

    await expect(useCase.execute('admin-2', 'admin-1')).rejects.toThrow(ForbiddenException);
    await expect(useCase.execute('admin-2', 'admin-1')).rejects.toThrow(
      'Cannot deactivate the last active administrator',
    );
  });

  it('should allow deactivating an admin when there are multiple active admins', async () => {
    const admin = makeUser({ id: 'admin-2', role: UserRole.ADMINISTRATOR, isActive: true });
    userRepository.findById.mockResolvedValue(admin);
    userRepository.countActiveAdmins.mockResolvedValue(3);

    const result = await useCase.execute('admin-2', 'admin-1');

    expect(result.isActive).toBe(false);
  });

  it('should not check admin count when deactivating a regular user', async () => {
    const user = makeUser({ role: UserRole.USER, isActive: true });
    userRepository.findById.mockResolvedValue(user);

    await useCase.execute('user-1', 'admin-1');

    expect(userRepository.countActiveAdmins).not.toHaveBeenCalled();
  });
});
