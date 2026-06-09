import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
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
import { MonthPicker } from '@/components/ui/month-picker';
import {
  updateSubmissionSchema,
  type UpdateSubmissionFormData,
} from '../types/submission-form.schema';
import type { SubmissionResponse, UpdateSubmissionPayload } from '@/types';

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  submission: SubmissionResponse | null;
  loading: boolean;
  onSubmit: (id: string, payload: UpdateSubmissionPayload) => void;
}

export function SubmissionEditDialog({
  open,
  onOpenChange,
  submission,
  loading,
  onSubmit,
}: Props) {
  const { t, i18n } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateSubmissionFormData>({
    resolver: zodResolver(updateSubmissionSchema),
  });

  useEffect(() => {
    if (open && submission) {
      reset({
        referenceMonth: submission.referenceMonth,
        deliveryEmail: submission.deliveryEmail,
        notes: submission.notes ?? '',
      });
    }
  }, [open, submission, reset]);

  if (!submission) return null;

  function handleFormSubmit(data: UpdateSubmissionFormData) {
    onSubmit(submission!.id, {
      referenceMonth: data.referenceMonth,
      deliveryEmail: data.deliveryEmail,
      notes: data.notes ?? null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('statusReports.form.editSubmission')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
          <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/30 bg-sky-500/[0.08] p-3 text-[12.5px] text-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <div>
              <p className="font-medium leading-tight">{t('statusReports.form.editImmutableHint')}</p>
              <p className="mt-0.5 text-muted-foreground">
                {t('statusReports.form.editImmutableFields', {
                  company: submission.company.tradeName,
                })}
              </p>
            </div>
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
            <Textarea id="notes" {...register('notes')} rows={3} className="resize-none" />
          </div>

          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="font-semibold">
              {loading ? t('common.saving') : t('statusReports.form.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
