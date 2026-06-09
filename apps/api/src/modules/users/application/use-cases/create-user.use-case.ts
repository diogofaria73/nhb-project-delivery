import { Inject, Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserResponseDto } from '../dtos/user-response.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException('Password confirmation does not match');
    }

    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = new User({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role ?? UserRole.USER,
      isActive: false,
      mustChangePassword: true,
    });

    const createdUser = await this.userRepository.create(user);
    return UserResponseDto.fromEntity(createdUser);
  }
}
