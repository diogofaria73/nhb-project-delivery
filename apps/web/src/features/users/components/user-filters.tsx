import { Search, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserRole } from '@/types';

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  role?: UserRole;
  onRoleChange: (value: UserRole | undefined) => void;
  isActive?: boolean;
  onStatusChange: (value: boolean | undefined) => void;
  onCreateClick: () => void;
}

export function UserFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  isActive,
  onStatusChange,
  onCreateClick,
}: UserFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('users.searchPlaceholder')}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>

          <Select
            value={role ?? 'all'}
            onValueChange={(v) => onRoleChange(v === 'all' ? undefined : (v as UserRole))}
          >
            <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
              <SelectValue placeholder={t('users.allRoles')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('users.allRoles')}</SelectItem>
              <SelectItem value="ADMINISTRATOR">{t('users.roles.administrator')}</SelectItem>
              <SelectItem value="USER">{t('users.roles.user')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={isActive === undefined ? 'all' : isActive ? 'active' : 'inactive'}
            onValueChange={(v) => {
              if (v === 'all') onStatusChange(undefined);
              else onStatusChange(v === 'active');
            }}
          >
            <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
              <SelectValue placeholder={t('users.allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('users.allStatus')}</SelectItem>
              <SelectItem value="active">{t('users.active')}</SelectItem>
              <SelectItem value="inactive">{t('users.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onCreateClick} size="sm" className="h-9 gap-1.5 px-4 font-semibold">
          <Plus className="h-4 w-4" />
          {t('users.newUser')}
        </Button>
      </div>
    </div>
  );
}
