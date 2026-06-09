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

export function GoalDeleteDialog({ open, onOpenChange, goal, loading, onConfirm }: Props) {
  const { t } = useTranslation();
  if (!goal) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[420px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('goals.deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('goals.deleteDialog.description', { period: goal.periodLabel })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-sm">{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? t('common.processing') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
