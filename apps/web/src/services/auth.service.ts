import { apiClient } from './api-client';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

interface AuthResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isLocked?: boolean;
  mustChangePassword: boolean;
  redirectTo?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RegisterResponse {
  message: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', payload);
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/users', payload);
  },

  async me(): Promise<AuthResponse> {
    return apiClient.get<AuthResponse>('/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore errors — clear local state regardless
    }
    const language = localStorage.getItem('language');
    const theme = localStorage.getItem('theme');
    localStorage.clear();
    if (language) localStorage.setItem('language', language);
    if (theme) localStorage.setItem('theme', theme);
  },
};
