import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '../components/login-form';
import { RegisterForm } from '../components/register-form';
import { BrandPanel } from '../components/brand-panel';

export function LoginPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<'login' | 'register'>('login');

  return (
    <div
      className="grid min-h-screen lg:grid-cols-2"
      style={{
        background:
          'var(--hy-bg) radial-gradient(1200px 600px at 80% -10%, #2a323d 0%, transparent 60%)',
      }}
    >
      {/* Left: form column */}
      <div className="relative flex items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile-only top wordmark */}
        <div className="absolute left-6 top-6 flex items-center lg:hidden">
          <span
            className="hy-display"
            style={{
              fontSize: 18,
              letterSpacing: '.22em',
              color: 'var(--hy-ink)',
            }}
          >
            HYDRO
          </span>
        </div>

        <div className="w-full max-w-[440px] animate-slide-up">
          <div
            className="hy-panel"
            style={{
              padding: '40px 36px 32px',
            }}
          >
            {view === 'login' ? (
              <LoginForm onRegisterClick={() => setView('register')} />
            ) : (
              <RegisterForm
                onLoginClick={() => setView('login')}
                onSuccess={() => setView('login')}
              />
            )}
          </div>

          <p
            style={{
              marginTop: 28,
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--hy-ink-faint)',
              letterSpacing: '.04em',
            }}
          >
            {t('auth.hero.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>

      {/* Right: brand panel (lg+) */}
      <BrandPanel />
    </div>
  );
}
