import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { userService } from '@/services/user.service';
import type { User } from '@/types';

interface ProfileFormProps {
  user: User;
  onUpdated: (user: User) => void;
}

export function ProfileForm({ user, onUpdated }: ProfileFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [loading, setLoading] = useState(false);

  const roleLabel = user.role === 'ADMINISTRATOR'
    ? t('users.roles.administrator')
    : t('users.roles.user');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await userService.updateUser(user.id, { name, email });
      localStorage.setItem('user', JSON.stringify(updated));
      onUpdated(updated);
      toast.success(t('account.profile.success'));
    } catch {
      toast.error(t('account.profile.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-foreground">{t('account.profile.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('account.profile.description')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('account.profile.name')}
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('account.profile.namePlaceholder')}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('account.profile.email')}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('account.profile.emailPlaceholder')}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('account.profile.role')}
          </Label>
          <div>
            <Badge variant="secondary" className="text-xs font-medium">
              {roleLabel}
            </Badge>
          </div>
        </div>

        <Button type="submit" size="sm" disabled={loading} className="mt-2 font-semibold">
          {loading ? t('account.profile.saving') : t('account.profile.save')}
        </Button>
      </form>
    </div>
  );
}
