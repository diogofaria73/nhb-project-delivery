import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';

export function FirstLoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error(t('firstLogin.errors.tooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('firstLogin.errors.mismatch'));
      return;
    }
    if (newPassword === currentPassword) {
      toast.error(t('firstLogin.errors.sameAsCurrent'));
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword({
        currentPassword,
        newPassword,
        newPasswordConfirmation: confirmPassword,
      });

      const fresh = await authService.me();
      localStorage.setItem('user', JSON.stringify(fresh));

      toast.success(t('firstLogin.success'));
      navigate('/status-reports', { replace: true });
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || t('firstLogin.errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] p-3.5 text-[13px] text-foreground">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
        <div className="space-y-1">
          <p className="font-medium">{t('firstLogin.notice.title')}</p>
          <p className="text-muted-foreground">{t('firstLogin.notice.body')}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="currentPassword"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {t('firstLogin.fields.current')}
        </Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={t('firstLogin.fields.currentPlaceholder')}
          className="h-10"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="newPassword"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {t('firstLogin.fields.new')}
        </Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t('firstLogin.fields.newPlaceholder')}
          className="h-10"
          required
          minLength={8}
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="confirmPassword"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {t('firstLogin.fields.confirm')}
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('firstLogin.fields.confirmPlaceholder')}
          className="h-10"
          required
          minLength={8}
        />
      </div>

      <Button
        type="submit"
        className="h-10 w-full font-semibold"
        disabled={loading || !currentPassword || !newPassword || !confirmPassword}
      >
        <KeyRound className="mr-2 h-4 w-4" />
        {loading ? t('firstLogin.submitting') : t('firstLogin.submit')}
      </Button>
    </form>
  );
}
