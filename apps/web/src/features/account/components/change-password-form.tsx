import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { userService } from '@/services/user.service';

export function ChangePasswordForm() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error(t('account.password.mismatch'));
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword({
        currentPassword,
        newPassword,
        newPasswordConfirmation: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('account.password.success'));
    } catch {
      toast.error(t('account.password.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-foreground">{t('account.password.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('account.password.description')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('account.password.current')}
          </Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t('account.password.currentPlaceholder')}
            className="h-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('account.password.new')}
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('account.password.newPlaceholder')}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('account.password.confirm')}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('account.password.confirmPlaceholder')}
              className="h-10"
            />
          </div>
        </div>

        <Button type="submit" size="sm" disabled={loading || !currentPassword || !newPassword} className="mt-2 font-semibold">
          {loading ? t('account.password.saving') : t('account.password.save')}
        </Button>
      </form>
    </div>
  );
}
