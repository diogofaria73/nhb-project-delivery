import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Info } from 'lucide-react';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from '../types/user-form.schema';
import type { User } from '@/types';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  user?: User | null;
  loading: boolean;
  onSubmit: (data: CreateUserFormData | UpdateUserFormData) => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  mode,
  user,
  loading,
  onSubmit,
}: UserFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = mode === 'edit';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
  });

  const roleValue = watch('role');

  useEffect(() => {
    if (open) {
      if (isEdit && user) {
        reset({
          name: user.name,
          email: user.email,
          role: user.role,
        });
      } else {
        reset({
          name: '',
          email: '',
          role: undefined,
          password: '',
          passwordConfirmation: '',
        });
      }
    }
  }, [open, isEdit, user, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('users.form.editUser') : t('users.form.newUser')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {!isEdit && (
            <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/30 bg-sky-500/[0.08] p-3 text-[12.5px] text-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <div className="space-y-0.5">
                <p className="font-medium leading-tight">
                  {t('users.form.firstLoginNotice.title')}
                </p>
                <p className="text-muted-foreground leading-snug">
                  {t('users.form.firstLoginNotice.body')}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('users.form.fullName')}
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder={t('users.form.fullNamePlaceholder')}
              className="h-10"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('users.form.email')}
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder={t('users.form.emailPlaceholder')}
              className="h-10"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('users.form.role')}</Label>
            <Select
              value={roleValue ?? ''}
              onValueChange={(v) =>
                setValue('role', v as CreateUserFormData['role'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t('users.form.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMINISTRATOR">{t('users.roles.administrator')}</SelectItem>
                <SelectItem value="USER">{t('users.roles.user')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('users.form.password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder={t('users.form.passwordPlaceholder')}
                  className="h-10"
                />
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passwordConfirmation" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('users.form.confirm')}
                </Label>
                <Input
                  id="passwordConfirmation"
                  type="password"
                  {...register('passwordConfirmation')}
                  placeholder={t('users.form.confirmPlaceholder')}
                  className="h-10"
                />
                {errors.passwordConfirmation && (
                  <p className="text-xs text-destructive">
                    {errors.passwordConfirmation.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="font-semibold">
              {loading ? t('common.saving') : isEdit ? t('users.form.save') : t('users.form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
