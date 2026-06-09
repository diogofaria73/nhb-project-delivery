import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLogo } from '@/components/app-logo';
import { useCurrentUser } from '@/hooks/use-current-user';
import { FirstLoginForm } from '../components/first-login-form';

export function FirstLoginPage() {
  const { t } = useTranslation();
  const { user, mustChangePassword } = useCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!mustChangePassword) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[440px] animate-slide-up">
        <div className="rounded-xl border border-border bg-card p-8 shadow-elevated">
          <div className="mb-6 flex justify-center">
            <AppLogo variant="full" className="h-7" />
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {t('firstLogin.title')}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t('firstLogin.subtitle', { name: user.name })}
            </p>
          </div>

          <FirstLoginForm />
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {t('auth.hero.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}
