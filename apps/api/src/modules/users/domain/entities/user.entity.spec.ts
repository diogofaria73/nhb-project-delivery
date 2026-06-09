import { User } from './user.entity';
import { UserRole } from '../value-objects/user-role.vo';

function makeUser(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
  return new User({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    role: UserRole.USER,
    ...overrides,
  });
}

describe('User Entity', () => {
  describe('creation', () => {
    it('should create a user with default values', () => {
      const user = makeUser();

      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe(UserRole.USER);
      expect(user.isActive).toBe(true);
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
      expect(user.id).toBeDefined();
    });

    it('should create an inactive user when specified', () => {
      const user = makeUser({ isActive: false });
      expect(user.isActive).toBe(false);
    });
  });

  describe('role checks', () => {
    it('should identify administrator', () => {
      const user = makeUser({ role: UserRole.ADMINISTRATOR });
      expect(user.isAdministrator).toBe(true);
      expect(user.isUser).toBe(false);
    });

    it('should identify regular user', () => {
      const user = makeUser({ role: UserRole.USER });
      expect(user.isUser).toBe(true);
      expect(user.isAdministrator).toBe(false);
    });
  });

  describe('lockout mechanism', () => {
    it('should not be locked initially', () => {
      const user = makeUser();
      expect(user.isLocked).toBe(false);
    });

    it('should increment failed attempts without locking before threshold', () => {
      const user = makeUser();

      for (let i = 0; i < 4; i++) {
        user.registerFailedLogin();
      }

      expect(user.failedLoginAttempts).toBe(4);
      expect(user.isLocked).toBe(false);
    });

    it('should lock account after 5 failed attempts', () => {
      const user = makeUser();

      for (let i = 0; i < 5; i++) {
        user.registerFailedLogin();
      }

      expect(user.failedLoginAttempts).toBe(5);
      expect(user.isLocked).toBe(true);
      expect(user.lockedUntil).not.toBeNull();
    });

    it('should not be locked if lockedUntil is in the past', () => {
      const pastDate = new Date(Date.now() - 1000);
      const user = makeUser({ lockedUntil: pastDate, failedLoginAttempts: 5 });
      expect(user.isLocked).toBe(false);
    });

    it('should reset login attempts and lockout', () => {
      const user = makeUser();

      for (let i = 0; i < 5; i++) {
        user.registerFailedLogin();
      }
      expect(user.isLocked).toBe(true);

      user.resetLoginAttempts();
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
      expect(user.isLocked).toBe(false);
    });

    it('should unlock user', () => {
      const user = makeUser();

      for (let i = 0; i < 5; i++) {
        user.registerFailedLogin();
      }

      user.unlock();
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
      expect(user.isLocked).toBe(false);
    });
  });

  describe('state transitions', () => {
    it('should activate user', () => {
      const user = makeUser({ isActive: false });
      user.activate();
      expect(user.isActive).toBe(true);
    });

    it('should deactivate user', () => {
      const user = makeUser({ isActive: true });
      user.deactivate();
      expect(user.isActive).toBe(false);
    });
  });

  describe('updates', () => {
    it('should update name', () => {
      const user = makeUser();
      const before = user.updatedAt;

      user.updateName('Jane Doe');
      expect(user.name).toBe('Jane Doe');
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should update email', () => {
      const user = makeUser();
      user.updateEmail('jane@example.com');
      expect(user.email).toBe('jane@example.com');
    });

    it('should update password', () => {
      const user = makeUser();
      user.updatePassword('new-hashed-password');
      expect(user.password).toBe('new-hashed-password');
    });

    it('should update role', () => {
      const user = makeUser({ role: UserRole.USER });
      user.updateRole(UserRole.ADMINISTRATOR);
      expect(user.role).toBe(UserRole.ADMINISTRATOR);
    });
  });
});
