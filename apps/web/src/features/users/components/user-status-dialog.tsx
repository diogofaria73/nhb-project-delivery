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
import type { User } from '@/types';

interface UserStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  loading: boolean;
  onConfirm: () => void;
}

export function UserStatusDialog({
  open,
  onOpenChange,
  user,
  loading,
  onConfirm,
}: UserStatusDialogProps) {
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[400px]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {user.isActive ? t('users.statusDialog.deactivateTitle') : t('users.statusDialog.activateTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {user.isActive ? t('users.statusDialog.deactivateConfirm') : t('users.statusDialog.activateConfirm')}{' '}
            <span className="font-medium text-foreground">{user.name}</span>?
            {user.isActive && ` ${t('users.statusDialog.deactivateWarning')}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-sm">{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={
              user.isActive
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : undefined
            }
          >
            {loading
              ? t('common.processing')
              : user.isActive
                ? t('users.actions.deactivate')
                : t('users.actions.activate')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
