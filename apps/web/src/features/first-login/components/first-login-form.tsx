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
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || t('firstLogin.errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: 14,
          borderRadius: 10,
          border: '1px solid rgba(207, 106, 85, 0.35)',
          background: 'rgba(207, 106, 85, 0.08)',
          fontSize: 12.5,
          color: 'var(--hy-ink)',
        }}
      >
        <ShieldAlert
          size={16}
          color="var(--hy-status-not-started)"
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontWeight: 600, margin: 0 }}>
            {t('firstLogin.notice.title')}
          </p>
          <p style={{ margin: 0, color: 'var(--hy-ink-dim)' }}>
            {t('firstLogin.notice.body')}
          </p>
        </div>
      </div>

      <Field
        id="currentPassword"
        label={t('firstLogin.fields.current')}
      >
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={t('firstLogin.fields.currentPlaceholder')}
          style={{ height: 44 }}
          required
        />
      </Field>

      <Field id="newPassword" label={t('firstLogin.fields.new')}>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t('firstLogin.fields.newPlaceholder')}
          style={{ height: 44 }}
          required
          minLength={8}
        />
      </Field>

      <Field id="confirmPassword" label={t('firstLogin.fields.confirm')}>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('firstLogin.fields.confirmPlaceholder')}
          style={{ height: 44 }}
          required
          minLength={8}
        />
      </Field>

      <Button
        type="submit"
        disabled={
          loading || !currentPassword || !newPassword || !confirmPassword
        }
        style={{
          height: 46,
          marginTop: 4,
          background: 'var(--hy-teal)',
          color: '#1b2027',
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: '.02em',
          border: '1px solid var(--hy-teal-bright)',
        }}
      >
        <KeyRound style={{ marginRight: 8 }} size={16} />
        {loading ? t('firstLogin.submitting') : t('firstLogin.submit')}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Label
        htmlFor={id}
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.14em',
          color: 'var(--hy-ink-faint)',
        }}
      >
        {label}
      </Label>
      {children}
    </div>
  );
}
