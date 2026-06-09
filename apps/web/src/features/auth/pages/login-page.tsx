import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '../components/login-form';
import { RegisterForm } from '../components/register-form';
import { BrandPanel } from '../components/brand-panel';
import { AppLogo } from '@/components/app-logo';

export function LoginPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<'login' | 'register'>('login');

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Left: form column */}
      <div className="relative flex items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile-only top logo */}
        <div className="absolute left-6 top-6 flex items-center gap-2 lg:hidden">
          <AppLogo className="h-7 w-7" />
          <span className="text-sm font-semibold tracking-tight text-foreground">NHB</span>
        </div>

        <div className="w-full max-w-[400px] animate-slide-up">
          {view === 'login' ? (
            <LoginForm onRegisterClick={() => setView('register')} />
          ) : (
            <RegisterForm
              onLoginClick={() => setView('login')}
              onSuccess={() => setView('login')}
            />
          )}

          <p className="mt-10 text-center text-[11px] text-muted-foreground">
            {t('auth.hero.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>

      {/* Right: brand panel (lg+) */}
      <BrandPanel />
    </div>
  );
}
