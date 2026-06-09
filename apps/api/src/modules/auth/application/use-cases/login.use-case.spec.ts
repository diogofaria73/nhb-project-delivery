import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginUseCase } from './login.use-case';
import { User } from '@modules/users/domain/entities/user.entity';
import { UserRole } from '@modules/users/domain/value-objects/user-role.vo';
import { IUserRepository } from '@modules/users/domain/repositories/user.repository';

jest.mock('bcrypt');

function makeUser(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
  return new User({
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    role: UserRole.ADMINISTRATOR,
    isActive: true,
    ...overrides,
  });
}

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      countActiveAdmins: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    } as unknown as jest.Mocked<JwtService>;

    useCase = new LoginUseCase(userRepository, jwtService);
  });

  it('should login successfully with valid credentials', async () => {
    const user = makeUser();
    userRepository.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await useCase.execute({ email: 'john@example.com', password: 'correct-password' });

    expect(result.token).toBe('jwt-token');
    expect(result.user.id).toBe('user-1');
    expect(result.user.email).toBe('john@example.com');
    expect(userRepository.update).toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'john@example.com',
      role: UserRole.ADMINISTRATOR,
    });
  });

  it('should reset login attempts on successful login', async () => {
    const user = makeUser({ failedLoginAttempts: 3 });
    userRepository.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await useCase.execute({ email: 'john@example.com', password: 'correct-password' });

    expect(user.failedLoginAttempts).toBe(0);
    expect(userRepository.update).toHaveBeenCalledWith(user);
  });

  it('should throw when email is not found', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'unknown@example.com', password: 'any' }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      useCase.execute({ email: 'unknown@example.com', password: 'any' }),
    ).rejects.toThrow('Incorrect email or password');
  });

  it('should throw when user is inactive (BR-03)', async () => {
    const user = makeUser({ isActive: false });
    userRepository.findByEmail.mockResolvedValue(user);

    await expect(
      useCase.execute({ email: 'john@example.com', password: 'any' }),
    ).rejects.toThrow('Inactive user. Please contact the administrator.');
  });

  it('should throw when account is locked (BR-04/BR-05)', async () => {
    const user = makeUser({
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
    });
    userRepository.findByEmail.mockResolvedValue(user);

    await expect(
      useCase.execute({ email: 'john@example.com', password: 'any' }),
    ).rejects.toThrow('Account temporarily locked. Please try again in 15 minutes.');
  });

  it('should increment failed attempts on wrong password', async () => {
    const user = makeUser();
    userRepository.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'john@example.com', password: 'wrong' }),
    ).rejects.toThrow('Incorrect email or password');

    expect(user.failedLoginAttempts).toBe(1);
    expect(userRepository.update).toHaveBeenCalledWith(user);
  });

  it('should lock account after 5 failed attempts', async () => {
    const user = makeUser({ failedLoginAttempts: 4 });
    userRepository.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'john@example.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(user.failedLoginAttempts).toBe(5);
    expect(user.isLocked).toBe(true);
  });
});
