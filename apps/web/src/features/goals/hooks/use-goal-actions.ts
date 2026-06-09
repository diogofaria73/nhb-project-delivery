import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { goalService } from '@/services/goal.service';
import type { ApiError, GoalCreatePayload, GoalUpdatePayload } from '@/types';

function getErrorMessage(error: unknown): string {
  const apiError = error as ApiError;
  if (Array.isArray(apiError?.message)) return apiError.message.join(', ');
  return apiError?.message || 'An unexpected error occurred';
}

export function useGoalActions({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function createGoal(payload: GoalCreatePayload): Promise<boolean> {
    setLoading(true);
    try {
      await goalService.createGoal(payload);
      toast.success(t('goals.toasts.created'));
      onSuccess();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function updateGoal(id: string, payload: GoalUpdatePayload): Promise<boolean> {
    setLoading(true);
    try {
      await goalService.updateGoal(id, payload);
      toast.success(t('goals.toasts.updated'));
      onSuccess();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function toggleArchive(id: string, currentlyArchived: boolean): Promise<boolean> {
    setLoading(true);
    try {
      await goalService.archiveGoal(id);
      toast.success(
        currentlyArchived ? t('goals.toasts.unarchived') : t('goals.toasts.archived'),
      );
      onSuccess();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function deleteGoal(id: string): Promise<boolean> {
    setLoading(true);
    try {
      await goalService.deleteGoal(id);
      toast.success(t('goals.toasts.deleted'));
      onSuccess();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { createGoal, updateGoal, toggleArchive, deleteGoal, loading };
}
