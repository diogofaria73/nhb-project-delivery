import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background:
          'var(--hy-bg) radial-gradient(1200px 600px at 80% -10%, #2a323d 0%, transparent 60%)',
      }}
    >
      <div className="w-full max-w-[460px] animate-slide-up">
        <div className="mb-6 flex justify-center">
          <span
            className="hy-display"
            style={{
              fontSize: 22,
              letterSpacing: '.22em',
              color: 'var(--hy-ink)',
            }}
          >
            HYDRO
          </span>
        </div>

        <div className="hy-panel" style={{ padding: '36px 32px 30px' }}>
          <div style={{ marginBottom: 24 }}>
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
              Acesso seguro
            </p>
            <h1
              className="hy-display"
              style={{
                fontSize: 28,
                margin: 0,
                color: 'var(--hy-ink)',
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
              }}
            >
              {t('firstLogin.title')}
            </h1>
            <p
              style={{
                marginTop: 8,
                fontSize: 13,
                color: 'var(--hy-ink-dim)',
                lineHeight: 1.5,
              }}
            >
              {t('firstLogin.subtitle', { name: user.name })}
            </p>
          </div>

          <FirstLoginForm />
        </div>

        <p
          style={{
            marginTop: 24,
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
  );
}
