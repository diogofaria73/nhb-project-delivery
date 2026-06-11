import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ProfileForm } from '../components/profile-form';
import { ChangePasswordForm } from '../components/change-password-form';
import type { User } from '@/types';

export function AccountPage() {
  const { t } = useTranslation();
  const { user: initialUser } = useCurrentUser();
  const [user, setUser] = useState<User | null>(initialUser);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <p
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '.18em',
            color: 'var(--hy-teal-bright)',
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Minha conta
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
          {t('account.title')}
        </h1>
        <p
          style={{
            marginTop: 8,
            fontSize: 13.5,
            color: 'var(--hy-ink-dim)',
            lineHeight: 1.5,
          }}
        >
          {t('account.description')}
        </p>
      </div>

      <ProfileForm user={user} onUpdated={setUser} />
      <ChangePasswordForm />
    </div>
  );
}
