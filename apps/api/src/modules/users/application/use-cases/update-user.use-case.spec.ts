import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UpdateUserUseCase } from './update-user.use-case';
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
    ...overrides,
  });
}

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
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

    useCase = new UpdateUserUseCase(userRepository);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', { name: 'New Name' }, 'admin-1', 'ADMINISTRATOR'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should update user name as admin', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute('user-1', { name: 'Jane Doe' }, 'admin-1', 'ADMINISTRATOR');

    expect(result.name).toBe('Jane Doe');
    expect(userRepository.update).toHaveBeenCalled();
  });

  it('should update email with uniqueness check', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);
    userRepository.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute('user-1', { email: 'new@example.com' }, 'admin-1', 'ADMINISTRATOR');

    expect(result.email).toBe('new@example.com');
  });

  it('should throw ConflictException when new email is taken', async () => {
    const user = makeUser();
    const existingUser = makeUser({ id: 'other-user', email: 'taken@example.com' });
    userRepository.findById.mockResolvedValue(user);
    userRepository.findByEmail.mockResolvedValue(existingUser);

    await expect(
      useCase.execute('user-1', { email: 'taken@example.com' }, 'admin-1', 'ADMINISTRATOR'),
    ).rejects.toThrow(ConflictException);
  });

  it('should not check email uniqueness when email is unchanged', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);

    await useCase.execute('user-1', { email: 'john@example.com' }, 'admin-1', 'ADMINISTRATOR');

    expect(userRepository.findByEmail).not.toHaveBeenCalled();
  });

  describe('regular user restrictions', () => {
    it('should allow regular user to edit their own profile', async () => {
      const user = makeUser();
      userRepository.findById.mockResolvedValue(user);

      const result = await useCase.execute('user-1', { name: 'Updated Name' }, 'user-1', 'USER');

      expect(result.name).toBe('Updated Name');
    });

    it('should forbid regular user from editing another user', async () => {
      const user = makeUser({ id: 'other-user' });
      userRepository.findById.mockResolvedValue(user);

      await expect(
        useCase.execute('other-user', { name: 'Hacked Name' }, 'user-1', 'USER'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        useCase.execute('other-user', { name: 'Hacked Name' }, 'user-1', 'USER'),
      ).rejects.toThrow('You can only edit your own profile');
    });

    it('should forbid regular user from changing their own role', async () => {
      const user = makeUser();
      userRepository.findById.mockResolvedValue(user);

      await expect(
        useCase.execute('user-1', { role: UserRole.ADMINISTRATOR }, 'user-1', 'USER'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        useCase.execute('user-1', { role: UserRole.ADMINISTRATOR }, 'user-1', 'USER'),
      ).rejects.toThrow('You cannot change your own role');
    });
  });

  describe('admin restrictions (BR-09)', () => {
    it('should forbid admin from changing their own role', async () => {
      const admin = makeUser({ id: 'admin-1', role: UserRole.ADMINISTRATOR });
      userRepository.findById.mockResolvedValue(admin);

      await expect(
        useCase.execute('admin-1', { role: UserRole.USER }, 'admin-1', 'ADMINISTRATOR'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        useCase.execute('admin-1', { role: UserRole.USER }, 'admin-1', 'ADMINISTRATOR'),
      ).rejects.toThrow('Cannot change your own profile role');
    });

    it('should allow admin to change another user role', async () => {
      const user = makeUser();
      userRepository.findById.mockResolvedValue(user);

      const result = await useCase.execute('user-1', { role: UserRole.ADMINISTRATOR }, 'admin-1', 'ADMINISTRATOR');

      expect(result.role).toBe(UserRole.ADMINISTRATOR);
    });
  });
});
