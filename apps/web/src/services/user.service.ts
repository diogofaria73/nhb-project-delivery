import { apiClient } from './api-client';
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  ListUsersParams,
  PaginatedResponse,
} from '@/types';

export const userService = {
  getMe(): Promise<User> {
    return apiClient.get<User>('/users/me');
  },

  listUsers(params: ListUsersParams = {}): Promise<PaginatedResponse<User>> {
    return apiClient.get<PaginatedResponse<User>>('/users', params as Record<string, unknown>);
  },

  getUserById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  createUser(payload: CreateUserPayload): Promise<User> {
    return apiClient.post<User>('/users', payload);
  },

  updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, payload);
  },

  toggleUserStatus(id: string): Promise<User> {
    return apiClient.patch<User>(`/users/${id}/toggle-status`);
  },

  unlockUser(id: string): Promise<User> {
    return apiClient.patch<User>(`/users/${id}/unlock`);
  },

  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirmation: string;
  }): Promise<void> {
    return apiClient.patch<void>('/users/me/password', payload);
  },
};
