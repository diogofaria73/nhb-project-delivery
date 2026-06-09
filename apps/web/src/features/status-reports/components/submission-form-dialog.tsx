import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MonthPicker } from '@/components/ui/month-picker';
import { FileUploader } from './file-uploader';
import {
  createSubmissionSchema,
  type CreateSubmissionFormData,
} from '../types/submission-form.schema';
import type { CompanyResponse, CreateSubmissionPayload } from '@/types';

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companies: CompanyResponse[];
  loading: boolean;
  onSubmit: (payload: CreateSubmissionPayload, files: File[]) => void;
}

export function SubmissionFormDialog({
  open,
  onOpenChange,
  companies,
  loading,
  onSubmit,
}: Props) {
  const { t, i18n } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSubmissionFormData>({
    resolver: zodResolver(createSubmissionSchema),
  });

  const companyId = watch('companyId');

  useEffect(() => {
    if (open) {
      reset({
        companyId: '',
        referenceMonth: currentMonth(),
        deliveryEmail: '',
        notes: '',
      });
      setFiles([]);
    }
  }, [open, reset]);

  function handleFormSubmit(data: CreateSubmissionFormData) {
    onSubmit(
      {
        companyId: data.companyId,
        referenceMonth: data.referenceMonth,
        deliveryEmail: data.deliveryEmail,
        notes: data.notes || undefined,
      },
      files,
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t('statusReports.form.newSubmission')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('statusReports.form.company')}
            </Label>
            <Select
              value={companyId ?? ''}
              onValueChange={(v) =>
                setValue('companyId', v, { shouldValidate: true })
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t('statusReports.form.companyPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {companies.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {t('statusReports.form.noActiveCompanies')}
                  </div>
                ) : (
                  companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.tradeName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.companyId && (
              <p className="text-xs text-destructive">{errors.companyId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="referenceMonth"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('statusReports.form.referenceMonth')}
              </Label>
              <MonthPicker
                id="referenceMonth"
                value={watch('referenceMonth')}
                onChange={(v) => setValue('referenceMonth', v, { shouldValidate: true })}
                max={currentMonth()}
                locale={i18n.language}
              />
              {errors.referenceMonth && (
                <p className="text-xs text-destructive">{errors.referenceMonth.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="deliveryEmail"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('statusReports.form.deliveryEmail')}
              </Label>
              <Input
                id="deliveryEmail"
                type="email"
                {...register('deliveryEmail')}
                placeholder={t('statusReports.form.deliveryEmailPlaceholder')}
                className="h-10"
              />
              {errors.deliveryEmail && (
                <p className="text-xs text-destructive">{errors.deliveryEmail.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="notes"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t('statusReports.form.notes')}
            </Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder={t('statusReports.form.notesPlaceholder')}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('statusReports.form.attachments')}
            </Label>
            <FileUploader
              files={files}
              onChange={setFiles}
              onError={(msg) => toast.error(msg)}
            />
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
              {loading ? t('common.saving') : t('statusReports.form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
