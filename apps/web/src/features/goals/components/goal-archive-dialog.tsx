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
import type { GoalResponse } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  goal: GoalResponse | null;
  loading: boolean;
  onConfirm: () => void;
}

export function GoalArchiveDialog({ open, onOpenChange, goal, loading, onConfirm }: Props) {
  const { t } = useTranslation();
  if (!goal) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[420px]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {goal.isArchived
              ? t('goals.archiveDialog.unarchiveTitle')
              : t('goals.archiveDialog.archiveTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {goal.isArchived
              ? t('goals.archiveDialog.unarchiveDescription', { period: goal.periodLabel })
              : t('goals.archiveDialog.archiveDescription', { period: goal.periodLabel })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-sm">{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading
              ? t('common.processing')
              : goal.isArchived
                ? t('goals.actions.unarchive')
                : t('goals.actions.archive')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
