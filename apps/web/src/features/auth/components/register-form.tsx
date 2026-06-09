import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { registerSchema, type RegisterFormData } from '../types/auth-form.schema';

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
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      toast.error(msg || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('auth.register')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('auth.registerDescription')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('auth.fullName')}
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder={t('auth.fullNamePlaceholder')}
            className="h-10"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('auth.email')}
          </Label>
          <Input
            id="reg-email"
            type="email"
            {...register('email')}
            placeholder={t('auth.emailPlaceholder')}
            className="h-10"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reg-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('auth.password')}
            </Label>
            <Input
              id="reg-password"
              type="password"
              {...register('password')}
              placeholder={t('auth.passwordMin')}
              className="h-10"
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-confirm" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('auth.confirmPassword')}
            </Label>
            <Input
              id="reg-confirm"
              type="password"
              {...register('passwordConfirmation')}
              placeholder={t('auth.confirmPlaceholder')}
              className="h-10"
            />
            {errors.passwordConfirmation && (
              <p className="text-xs text-destructive">{errors.passwordConfirmation.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="h-10 w-full font-semibold" disabled={loading}>
          {loading ? t('auth.creating') : t('auth.createAccount')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.hasAccount')}{' '}
        <button
          type="button"
          onClick={onLoginClick}
          className="font-semibold text-foreground hover:underline"
        >
          {t('auth.signIn')}
        </button>
      </p>
    </div>
  );
}
