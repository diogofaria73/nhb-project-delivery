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
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t('account.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('account.description')}
        </p>
      </div>

      <ProfileForm user={user} onUpdated={setUser} />
      <ChangePasswordForm />
    </div>
  );
}
