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
import type { SubmissionResponse } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  submission: SubmissionResponse | null;
  loading: boolean;
  onConfirm: () => void;
}

export function SubmissionDeleteDialog({
  open,
  onOpenChange,
  submission,
  loading,
  onConfirm,
}: Props) {
  const { t } = useTranslation();

  if (!submission) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[420px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('statusReports.deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('statusReports.deleteDialog.description', {
              company: submission.company.tradeName,
              month: submission.referenceMonth,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-sm">{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? t('common.processing') : t('statusReports.actions.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
