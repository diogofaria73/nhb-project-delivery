import { User } from '@modules/users/domain/entities/user.entity';
import { UserRole } from '@modules/users/domain/value-objects/user-role.vo';

export class AuthResponseDto {
  id!: string;
  name!: string;
  email!: string;
  role!: UserRole;
  isActive!: boolean;
  mustChangePassword!: boolean;
  redirectTo!: string;

  static fromEntity(user: User): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.role = user.role;
    dto.isActive = user.isActive;
    dto.mustChangePassword = user.mustChangePassword;
    dto.redirectTo = user.mustChangePassword ? '/first-login' : '/';
    return dto;
  }
}
