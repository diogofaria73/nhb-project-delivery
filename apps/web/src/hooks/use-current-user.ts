import { useMemo } from 'react';
import type { User, UserRole } from '@/types';

interface CurrentUser {
  user: User | null;
  isAdmin: boolean;
  isUser: boolean;
  role: UserRole | null;
  mustChangePassword: boolean;
}

export function useCurrentUser(): CurrentUser {
  return useMemo(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      return {
        user: null,
        isAdmin: false,
        isUser: false,
        role: null,
        mustChangePassword: false,
      };
    }
    const user = JSON.parse(stored) as User;
    return {
      user,
      isAdmin: user.role === 'ADMINISTRATOR',
      isUser: user.role === 'USER',
      role: user.role,
      mustChangePassword: Boolean(user.mustChangePassword),
    };
  }, []);
}
