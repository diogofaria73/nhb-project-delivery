import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { statusReportService } from '@/services/status-report.service';
import type {
  CreateSubmissionPayload,
  UpdateSubmissionPayload,
  ApiError,
} from '@/types';

function getErrorMessage(error: unknown): string {
  const apiError = error as ApiError;
  if (Array.isArray(apiError?.message)) return apiError.message.join(', ');
  return apiError?.message || 'An unexpected error occurred';
}

export function useSubmissionActions({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function createSubmission(
    payload: CreateSubmissionPayload,
    files: File[],
  ): Promise<boolean> {
    setLoading(true);
    try {
      await statusReportService.createSubmission(payload, files);
      toast.success(t('statusReports.toasts.created'));
      onSuccess();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function updateSubmission(id: string, payload: UpdateSubmissionPayload): Promise<boolean> {
    setLoading(true);
    try {
      await statusReportService.updateSubmission(id, payload);
      toast.success(t('statusReports.toasts.updated'));
      onSuccess();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function deleteSubmission(id: string): Promise<boolean> {
    setLoading(true);
    try {
      await statusReportService.deleteSubmission(id);
      toast.success(t('statusReports.toasts.deleted'));
      onSuccess();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { createSubmission, updateSubmission, deleteSubmission, loading };
}
