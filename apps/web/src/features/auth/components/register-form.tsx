import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import {
  registerSchema,
  type RegisterFormData,
} from '../types/auth-form.schema';

interface RegisterFormProps {
  onLoginClick: () => void;
  onSuccess: () => void;
}

export function RegisterForm({ onLoginClick, onSuccess }: RegisterFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setLoading(true);
    try {
      await authService.register(data);
      toast.success(t('auth.registerSuccess'));
      onSuccess();
    } catch (error) {
      const err = error as { message?: string | string[] };
      const msg = Array.isArray(err.message)
        ? err.message.join(', ')
        : err.message;
      toast.error(msg || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <p
          style={{
            fontSize: 10.5,
            textTransform: 'uppercase',
            letterSpacing: '.22em',
            color: 'var(--hy-teal-bright)',
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Status Report
        </p>
        <h1
          className="hy-display"
          style={{
            fontSize: 32,
            margin: 0,
            color: 'var(--hy-ink)',
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
          }}
        >
          {t('auth.register')}
        </h1>
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            color: 'var(--hy-ink-dim)',
            lineHeight: 1.5,
          }}
        >
          {t('auth.registerDescription')}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        <Field
          id="name"
          label={t('auth.fullName')}
          error={errors.name?.message}
        >
          <Input
            id="name"
            {...register('name')}
            placeholder={t('auth.fullNamePlaceholder')}
            style={{ height: 44 }}
          />
        </Field>

        <Field
          id="reg-email"
          label={t('auth.email')}
          error={errors.email?.message}
        >
          <Input
            id="reg-email"
            type="email"
            {...register('email')}
            placeholder={t('auth.emailPlaceholder')}
            style={{ height: 44 }}
          />
        </Field>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
          }}
        >
          <Field
            id="reg-password"
            label={t('auth.password')}
            error={errors.password?.message}
          >
            <Input
              id="reg-password"
              type="password"
              {...register('password')}
              placeholder={t('auth.passwordMin')}
              style={{ height: 44 }}
            />
          </Field>

          <Field
            id="reg-confirm"
            label={t('auth.confirmPassword')}
            error={errors.passwordConfirmation?.message}
          >
            <Input
              id="reg-confirm"
              type="password"
              {...register('passwordConfirmation')}
              placeholder={t('auth.confirmPlaceholder')}
              style={{ height: 44 }}
            />
          </Field>
        </div>

        <Button
          type="submit"
          disabled={loading}
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
          {loading ? t('auth.creating') : t('auth.createAccount')}
        </Button>
      </form>

      <p
        style={{
          marginTop: 24,
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--hy-ink-dim)',
        }}
      >
        {t('auth.hasAccount')}{' '}
        <button
          type="button"
          onClick={onLoginClick}
          style={{
            all: 'unset',
            cursor: 'pointer',
            fontWeight: 600,
            color: 'var(--hy-teal-bright)',
          }}
        >
          {t('auth.signIn')}
        </button>
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
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
      {error && (
        <p style={{ fontSize: 11.5, color: '#cf6a55', margin: 0 }}>{error}</p>
      )}
    </div>
  );
}
