import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Lock } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { formatCnpj, stripCnpj } from '@/lib/cnpj';
import { formatPhone } from '@/lib/phone';
import {
  createCompanySchema,
  updateCompanySchema,
  type CreateCompanyFormData,
  type UpdateCompanyFormData,
} from '../types/company-form.schema';
import type { CompanyResponse } from '@/types';

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  company?: CompanyResponse | null;
  loading: boolean;
  onSubmit: (data: CreateCompanyFormData | UpdateCompanyFormData) => void;
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  mode,
  company,
  loading,
  onSubmit,
}: CompanyFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = mode === 'edit';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCompanyFormData>({
    resolver: zodResolver(
      (isEdit ? updateCompanySchema : createCompanySchema) as typeof createCompanySchema,
    ),
  });

  const cnpjValue = watch('cnpj');

  useEffect(() => {
    if (open) {
      if (isEdit && company) {
        reset({
          tradeName: company.tradeName,
          legalName: company.legalName,
          cnpj: company.cnpjFormatted,
          contactEmail: company.contactEmail,
          contactPhone: company.contactPhone ?? '',
          notes: company.notes ?? '',
        });
      } else {
        reset({
          tradeName: '',
          legalName: '',
          cnpj: '',
          contactEmail: '',
          contactPhone: '',
          notes: '',
        });
      }
    }
  }, [open, isEdit, company, reset]);

  function handleCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCnpj(e.target.value);
    setValue('cnpj', formatted, { shouldValidate: true });
  }

  function handleFormSubmit(data: CreateCompanyFormData) {
    if (isEdit) {
      // CNPJ is immutable — strip it from the payload sent to the backend
      const { cnpj: _cnpj, ...rest } = data;
      onSubmit(rest as UpdateCompanyFormData);
      return;
    }
    onSubmit({ ...data, cnpj: stripCnpj(data.cnpj) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('companies.form.editCompany') : t('companies.form.newCompany')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
          {isEdit && (
            <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/30 bg-sky-500/[0.08] p-3 text-[12.5px] text-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <div className="space-y-0.5">
                <p className="font-medium leading-tight">{t('companies.form.cnpjImmutableHint')}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="tradeName"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('companies.form.tradeName')}
              </Label>
              <Input
                id="tradeName"
                {...register('tradeName')}
                placeholder={t('companies.form.tradeNamePlaceholder')}
                className="h-10"
              />
              {errors.tradeName && (
                <p className="text-xs text-destructive">{errors.tradeName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="legalName"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('companies.form.legalName')}
              </Label>
              <Input
                id="legalName"
                {...register('legalName')}
                placeholder={t('companies.form.legalNamePlaceholder')}
                className="h-10"
              />
              {errors.legalName && (
                <p className="text-xs text-destructive">{errors.legalName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="cnpj"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t('companies.form.cnpj')}
            </Label>
            <div className="relative">
              <Input
                id="cnpj"
                value={cnpjValue ?? ''}
                onChange={handleCnpjChange}
                disabled={isEdit}
                placeholder={t('companies.form.cnpjPlaceholder')}
                className="h-10 tabular-nums pr-9"
                inputMode="numeric"
                maxLength={18}
              />
              {isEdit && (
                <Lock className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
              )}
            </div>
            {!isEdit && errors.cnpj && (
              <p className="text-xs text-destructive">{errors.cnpj.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="contactEmail"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('companies.form.contactEmail')}
              </Label>
              <Input
                id="contactEmail"
                type="email"
                {...register('contactEmail')}
                placeholder={t('companies.form.contactEmailPlaceholder')}
                className="h-10"
              />
              {errors.contactEmail && (
                <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="contactPhone"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('companies.form.contactPhone')}
              </Label>
              <Input
                id="contactPhone"
                value={watch('contactPhone') ?? ''}
                onChange={(e) =>
                  setValue('contactPhone', formatPhone(e.target.value), {
                    shouldValidate: true,
                  })
                }
                placeholder={t('companies.form.contactPhonePlaceholder')}
                className="h-10 tabular-nums"
                inputMode="numeric"
                maxLength={16}
              />
              {errors.contactPhone && (
                <p className="text-xs text-destructive">{errors.contactPhone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="notes"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t('companies.form.notes')}
            </Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder={t('companies.form.notesPlaceholder')}
              rows={3}
              className="resize-none"
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            )}
          </div>

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
              {loading
                ? t('common.saving')
                : isEdit
                  ? t('companies.form.save')
                  : t('companies.form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
