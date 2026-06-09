import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { companyService } from '@/services/company.service';
import type {
  CreateCompanyPayload,
  UpdateCompanyPayload,
  ApiError,
} from '@/types';

function getErrorMessage(error: unknown): string {
  const apiError = error as ApiError;
  if (Array.isArray(apiError?.message)) {
    return apiError.message.join(', ');
  }
  return apiError?.message || 'An unexpected error occurred';
}

interface UseCompanyActionsProps {
  onSuccess: () => void;
}

export function useCompanyActions({ onSuccess }: UseCompanyActionsProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function createCompany(payload: CreateCompanyPayload): Promise<boolean> {
    setLoading(true);
    try {
      await companyService.createCompany(payload);
      toast.success(t('companies.toasts.created'));
      onSuccess();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function updateCompany(id: string, payload: UpdateCompanyPayload): Promise<boolean> {
    setLoading(true);
    try {
      await companyService.updateCompany(id, payload);
      toast.success(t('companies.toasts.updated'));
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
      await companyService.toggleCompanyStatus(id);
      toast.success(t('companies.toasts.statusUpdated'));
      onSuccess();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { createCompany, updateCompany, toggleStatus, loading };
}
