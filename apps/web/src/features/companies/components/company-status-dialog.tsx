import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CompanyResponse } from '@/types';

interface CompanyStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyResponse | null;
  loading: boolean;
  onConfirm: () => void;
}

export function CompanyStatusDialog({
  open,
  onOpenChange,
  company,
  loading,
  onConfirm,
}: CompanyStatusDialogProps) {
  const { t } = useTranslation();

  if (!company) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[420px]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {company.isActive
              ? t('companies.statusDialog.deactivateTitle')
              : t('companies.statusDialog.activateTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {company.isActive
              ? t('companies.statusDialog.deactivateConfirm')
              : t('companies.statusDialog.activateConfirm')}{' '}
            <span className="font-medium text-foreground">{company.tradeName}</span>?
            {company.isActive && ` ${t('companies.statusDialog.deactivateWarning')}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-sm">{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={
              company.isActive
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : undefined
            }
          >
            {loading
              ? t('common.processing')
              : company.isActive
                ? t('companies.actions.deactivate')
                : t('companies.actions.activate')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
