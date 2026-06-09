import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';

export class UserResponseDto {
  id!: string;
  name!: string;
  email!: string;
  role!: UserRole;
  isActive!: boolean;
  isLocked!: boolean;
  mustChangePassword!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.role = user.role;
    dto.isActive = user.isActive;
    dto.isLocked = user.isLocked;
    dto.mustChangePassword = user.mustChangePassword;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
