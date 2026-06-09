import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { loginSchema, type LoginFormData } from '../types/auth-form.schema';

interface LoginFormProps {
  onRegisterClick: () => void;
}

export function LoginForm({ onRegisterClick }: LoginFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    try {
      const { token: _token, redirectTo, ...user } = await authService.login(data);
      localStorage.setItem('user', JSON.stringify(user));
      if (user.mustChangePassword) {
        window.location.href = '/first-login';
        return;
      }
      window.location.href =
        redirectTo && redirectTo !== '/' ? redirectTo : '/status-reports';
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('auth.signIn')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('auth.signInDescription')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('auth.email')}
          </Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder={t('auth.emailPlaceholder')}
            className="h-10"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('auth.password')}
          </Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            placeholder={t('auth.passwordPlaceholder')}
            className="h-10"
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="h-10 w-full font-semibold" disabled={loading}>
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.noAccount')}{' '}
        <button
          type="button"
          onClick={onRegisterClick}
          className="font-semibold text-foreground hover:underline"
        >
          {t('auth.requestAccess')}
        </button>
      </p>
    </div>
  );
}
