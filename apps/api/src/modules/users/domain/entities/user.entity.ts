import { BaseEntity } from '@shared/domain/base.entity';
import { UserRole } from '../value-objects/user-role.vo';

export interface UserProps {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
  mustChangePassword?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends BaseEntity {
  private _name: string;
  private _email: string;
  private _password: string;
  private _role: UserRole;
  private _isActive: boolean;
  private _mustChangePassword: boolean;
  private _failedLoginAttempts: number;
  private _lockedUntil: Date | null;

  constructor(props: UserProps) {
    super(props.id);
    this._name = props.name;
    this._email = props.email;
    this._password = props.password;
    this._role = props.role;
    this._isActive = props.isActive ?? true;
    this._mustChangePassword = props.mustChangePassword ?? false;
    this._failedLoginAttempts = props.failedLoginAttempts ?? 0;
    this._lockedUntil = props.lockedUntil ?? null;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get password(): string {
    return this._password;
  }

  get role(): UserRole {
    return this._role;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get mustChangePassword(): boolean {
    return this._mustChangePassword;
  }

  get failedLoginAttempts(): number {
    return this._failedLoginAttempts;
  }

  get lockedUntil(): Date | null {
    return this._lockedUntil;
  }

  get isLocked(): boolean {
    if (!this._lockedUntil) return false;
    return this._lockedUntil > new Date();
  }

  get isAdministrator(): boolean {
    return this._role === UserRole.ADMINISTRATOR;
  }

  get isUser(): boolean {
    return this._role === UserRole.USER;
  }

  updateName(name: string): void {
    this._name = name;
    this.touch();
  }

  updateEmail(email: string): void {
    this._email = email;
    this.touch();
  }

  updatePassword(hashedPassword: string): void {
    this._password = hashedPassword;
    this.touch();
  }

  requirePasswordChange(): void {
    this._mustChangePassword = true;
    this.touch();
  }

  clearPasswordChangeRequirement(): void {
    this._mustChangePassword = false;
    this.touch();
  }

  updateRole(role: UserRole): void {
    this._role = role;
    this.touch();
  }

  activate(): void {
    this._isActive = true;
    this.touch();
  }

  deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  unlock(): void {
    this._failedLoginAttempts = 0;
    this._lockedUntil = null;
    this.touch();
  }

  registerFailedLogin(): void {
    this._failedLoginAttempts += 1;
    if (this._failedLoginAttempts >= 5) {
      this._lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }
    this.touch();
  }

  resetLoginAttempts(): void {
    this._failedLoginAttempts = 0;
    this._lockedUntil = null;
    this.touch();
  }
}
