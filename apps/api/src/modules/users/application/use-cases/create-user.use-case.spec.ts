import { ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserUseCase } from './create-user.use-case';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { IUserRepository } from '../../domain/repositories/user.repository';

jest.mock('bcrypt');

function makeUser(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
  return new User({
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    role: UserRole.USER,
    isActive: false,
    ...overrides,
  });
}

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      countActiveAdmins: jest.fn(),
    };
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    useCase = new CreateUserUseCase(userRepository);
  });

  it('should create a user successfully', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation(async (user) => user);

    const result = await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
    });

    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.role).toBe(UserRole.USER);
    expect(result.isActive).toBe(false);
    expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
  });

  it('should create a user with specified role', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation(async (user) => user);

    const result = await useCase.execute({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
      role: UserRole.ADMINISTRATOR,
    });

    expect(result.role).toBe(UserRole.ADMINISTRATOR);
  });

  it('should throw when password confirmation does not match', async () => {
    await expect(
      useCase.execute({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        passwordConfirmation: 'DifferentPassword!',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      useCase.execute({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        passwordConfirmation: 'DifferentPassword!',
      }),
    ).rejects.toThrow('Password confirmation does not match');
  });

  it('should throw when email is already registered', async () => {
    userRepository.findByEmail.mockResolvedValue(makeUser());

    await expect(
      useCase.execute({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      }),
    ).rejects.toThrow(ConflictException);
    await expect(
      useCase.execute({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      }),
    ).rejects.toThrow('Email already registered');
  });

  it('should create user as inactive by default', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation(async (user) => user);

    const result = await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
    });

    expect(result.isActive).toBe(false);
  });
});
