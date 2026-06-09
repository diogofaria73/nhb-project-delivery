import { Lock, MoreHorizontal, Pencil, UserX, UserCheck, Unlock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { User, UserRole } from '@/types';

function formatDate(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const roleColorMap: Record<UserRole, string> = {
  ADMINISTRATOR: 'bg-primary/10 text-primary border-0',
  USER: 'bg-secondary text-secondary-foreground border-0',
};

interface UserTableProps {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onUnlock: (user: User) => void;
}

export function UserTable({
  users,
  loading,
  onEdit,
  onToggleStatus,
  onUnlock,
}: UserTableProps) {
  const { t, i18n } = useTranslation();

  const roleLabels: Record<UserRole, string> = {
    ADMINISTRATOR: t('users.roles.administrator'),
    USER: t('users.roles.user'),
  };

  if (loading) {
    return <UserTableSkeleton />;
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
        <p className="text-sm font-medium text-muted-foreground">{t('users.noUsersFound')}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('users.noUsersHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-5">{t('users.name')}</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('users.emailColumn')}</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('users.role')}</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('users.status')}</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('users.created')}</TableHead>
            <TableHead className="w-[48px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className={cn(
                'group transition-colors border-border/70',
                !user.isActive && 'opacity-50',
              )}
            >
              <TableCell className="py-3.5 pl-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
                      {user.isLocked && (
                        <Lock className="h-3 w-3 text-amber-500 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.email}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn('text-xs font-medium rounded-md px-2.5 py-0.5', roleColorMap[user.role])}
                >
                  {roleLabels[user.role]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      user.isActive ? 'bg-emerald-500' : 'bg-destructive',
                    )}
                  />
                  <span className="text-sm text-muted-foreground">
                    {user.isActive ? t('users.active') : t('users.inactive')}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground tabular-nums">
                {formatDate(user.createdAt, i18n.language)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[150px]">
                    <DropdownMenuItem onClick={() => onEdit(user)} className="text-sm">
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      {t('users.actions.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleStatus(user)} className="text-sm">
                      {user.isActive ? (
                        <>
                          <UserX className="mr-2 h-3.5 w-3.5" />
                          {t('users.actions.deactivate')}
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-3.5 w-3.5" />
                          {t('users.actions.activate')}
                        </>
                      )}
                    </DropdownMenuItem>
                    {user.isLocked && (
                      <DropdownMenuItem onClick={() => onUnlock(user)} className="text-sm">
                        <Unlock className="mr-2 h-3.5 w-3.5" />
                        {t('users.actions.unlock')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UserTableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-5">&mdash;</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">&mdash;</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">&mdash;</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">&mdash;</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">&mdash;</TableHead>
            <TableHead className="w-[48px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i} className="border-border/70">
              <TableCell className="py-3.5 pl-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
              <TableCell><Skeleton className="h-4 w-14" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
