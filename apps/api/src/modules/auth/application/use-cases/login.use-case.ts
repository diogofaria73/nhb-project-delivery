import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUserRepository, USER_REPOSITORY } from '@modules/users/domain/repositories/user.repository';
import { LoginDto } from '../dtos/login.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<{ token: string; user: AuthResponseDto }> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    // BR-03: Inactive users cannot log in — exception: users awaiting
    // their first password change are allowed to authenticate so they can
    // complete the mandatory password change and be auto-activated.
    if (!user.isActive && !user.mustChangePassword) {
      throw new UnauthorizedException(
        'Inactive user. Please contact the administrator.',
      );
    }

    // BR-04/BR-05: Account lockout check
    if (user.isLocked) {
      throw new UnauthorizedException(
        'Account temporarily locked. Please try again in 15 minutes.',
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      user.registerFailedLogin();
      await this.userRepository.update(user);
      throw new UnauthorizedException('Incorrect email or password');
    }

    // Successful login — reset attempts
    user.resetLoginAttempts();
    await this.userRepository.update(user);

    // Generate JWT (BR-01: 8h validity configured in module)
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
    const token = this.jwtService.sign(payload);

    return { token, user: AuthResponseDto.fromEntity(user) };
  }
}
