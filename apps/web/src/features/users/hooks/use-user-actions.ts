import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { userService } from '@/services/user.service';
import type { CreateUserPayload, UpdateUserPayload, ApiError } from '@/types';

function getErrorMessage(error: unknown): string {
  const apiError = error as ApiError;
  if (Array.isArray(apiError?.message)) {
    return apiError.message.join(', ');
  }
  return apiError?.message || 'An unexpected error occurred';
}

interface UseUserActionsProps {
  onSuccess: () => void;
}

export function useUserActions({ onSuccess }: UseUserActionsProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function createUser(payload: CreateUserPayload): Promise<boolean> {
    setLoading(true);
    try {
      await userService.createUser(payload);
      toast.success(t('users.toasts.created.title'), {
        description: t('users.toasts.created.description'),
      });
      onSuccess();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(
    id: string,
    payload: UpdateUserPayload,
  ): Promise<boolean> {
    setLoading(true);
    try {
      await userService.updateUser(id, payload);
      toast.success('User updated successfully');
      onSuccess();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(id: string): Promise<boolean> {
    setLoading(true);
    try {
      await userService.toggleUserStatus(id);
      toast.success('User status updated');
      onSuccess();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function unlockUser(id: string): Promise<boolean> {
    setLoading(true);
    try {
      await userService.unlockUser(id);
      toast.success('User unlocked successfully');
      onSuccess();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { createUser, updateUser, toggleStatus, unlockUser, loading };
}
