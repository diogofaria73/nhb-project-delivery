import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, CalendarClock, Package } from 'lucide-react';
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
import {
  createGoalSchema,
  type CreateGoalFormData,
} from '../types/goal-form.schema';
import type {
  GoalCreatePayload,
  GoalResponse,
  GoalUpdatePayload,
  PeriodType,
} from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: 'create' | 'edit';
  goal?: GoalResponse | null;
  loading: boolean;
  onSubmit: (payload: GoalCreatePayload | GoalUpdatePayload) => void;
}

function monthsInPeriod(type: PeriodType): number {
  return type === 'QUARTERLY' ? 3 : type === 'SEMESTRAL' ? 6 : 12;
}

export function GoalFormDialog({ open, onOpenChange, mode, goal, loading, onSubmit }: Props) {
  const { t } = useTranslation();
  const isEdit = mode === 'edit';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateGoalFormData>({
    resolver: zodResolver(createGoalSchema),
  });

  const periodType = watch('periodType');
  const deliveriesPerPeriod = watch('deliveriesPerPeriod');
  const monthlyDeadlineDay = watch('monthlyDeadlineDay');
  const isConcluded = isEdit && goal?.status === 'concluded';

  const defaultDeliveries = useMemo(
    () => (periodType ? monthsInPeriod(periodType as PeriodType) : 3),
    [periodType],
  );

  useEffect(() => {
    if (!open) return;
    if (isEdit && goal) {
      reset({
        periodType: goal.periodType,
        year: goal.year,
        periodIndex: goal.periodIndex ?? undefined,
        deliveriesPerPeriod: goal.deliveriesPerPeriod,
        monthlyDeadlineDay: goal.monthlyDeadlineDay,
        notes: goal.notes ?? '',
      });
    } else {
      const now = new Date();
      reset({
        periodType: 'QUARTERLY',
        year: now.getUTCFullYear(),
        periodIndex: Math.floor(now.getUTCMonth() / 3) + 1,
        deliveriesPerPeriod: 3,
        monthlyDeadlineDay: 25,
        notes: '',
      });
    }
  }, [open, isEdit, goal, reset]);

  useEffect(() => {
    if (!open || isEdit) return;
    setValue('deliveriesPerPeriod', defaultDeliveries, { shouldValidate: false });
  }, [defaultDeliveries, open, isEdit, setValue]);

  function handleFormSubmit(data: CreateGoalFormData) {
    if (isEdit) {
      const payload: GoalUpdatePayload = isConcluded
        ? { notes: data.notes ?? null }
        : {
            deliveriesPerPeriod: data.deliveriesPerPeriod,
            monthlyDeadlineDay: data.monthlyDeadlineDay,
            notes: data.notes ?? null,
          };
      onSubmit(payload);
      return;
    }
    onSubmit({
      periodType: data.periodType as PeriodType,
      year: data.year,
      periodIndex: data.periodType === 'ANNUAL' ? null : data.periodIndex ?? null,
      deliveriesPerPeriod: data.deliveriesPerPeriod,
      monthlyDeadlineDay: data.monthlyDeadlineDay,
      notes: data.notes || undefined,
    });
  }

  const indexOptions =
    periodType === 'QUARTERLY' ? [1, 2, 3, 4] : periodType === 'SEMESTRAL' ? [1, 2] : [];
  const previewMonths = periodType ? monthsInPeriod(periodType as PeriodType) : 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('goals.form.editGoal') : t('goals.form.newGoal')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
          {isEdit && (
            <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/30 bg-sky-500/[0.08] p-3 text-[12.5px] text-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <div>
                <p className="font-medium leading-tight">
                  {t('goals.form.periodImmutableHint')}
                </p>
                {isConcluded && (
                  <p className="mt-0.5 text-muted-foreground">
                    {t('goals.form.concludedHint')}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-3 sm:col-span-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('goals.form.periodType')}
              </Label>
              <Select
                value={periodType ?? 'QUARTERLY'}
                disabled={isEdit}
                onValueChange={(v) =>
                  setValue('periodType', v as PeriodType, { shouldValidate: true })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t('goals.form.periodType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUARTERLY">{t('goals.periodTypes.QUARTERLY')}</SelectItem>
                  <SelectItem value="SEMESTRAL">{t('goals.periodTypes.SEMESTRAL')}</SelectItem>
                  <SelectItem value="ANNUAL">{t('goals.periodTypes.ANNUAL')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 col-span-3 sm:col-span-1">
              <Label
                htmlFor="year"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('goals.form.year')}
              </Label>
              <Input
                id="year"
                type="number"
                inputMode="numeric"
                disabled={isEdit}
                {...register('year', { valueAsNumber: true })}
                className="h-10 tabular-nums"
                min={2000}
                max={2100}
              />
              {errors.year && (
                <p className="text-xs text-destructive">{errors.year.message}</p>
              )}
            </div>

            {indexOptions.length > 0 && (
              <div className="space-y-1.5 col-span-3 sm:col-span-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {periodType === 'QUARTERLY'
                    ? t('goals.form.quarter')
                    : t('goals.form.semester')}
                </Label>
                <Select
                  value={String(watch('periodIndex') ?? '')}
                  disabled={isEdit}
                  onValueChange={(v) =>
                    setValue('periodIndex', Number(v), { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {indexOptions.map((i) => (
                      <SelectItem key={i} value={String(i)}>
                        {periodType === 'QUARTERLY' ? `Q${i}` : `S${i}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.periodIndex && (
                  <p className="text-xs text-destructive">{errors.periodIndex.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="deliveriesPerPeriod"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('goals.form.deliveriesPerPeriod')}
              </Label>
              <Input
                id="deliveriesPerPeriod"
                type="number"
                disabled={isConcluded}
                {...register('deliveriesPerPeriod', { valueAsNumber: true })}
                className="h-10 tabular-nums"
                min={1}
                max={366}
              />
              <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <Package className="h-3 w-3" />
                {t('goals.form.deliveriesPerPeriodHint', { months: previewMonths })}
              </p>
              {errors.deliveriesPerPeriod && (
                <p className="text-xs text-destructive">{errors.deliveriesPerPeriod.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="monthlyDeadlineDay"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('goals.form.monthlyDeadlineDay')}
              </Label>
              <Input
                id="monthlyDeadlineDay"
                type="number"
                disabled={isConcluded}
                {...register('monthlyDeadlineDay', { valueAsNumber: true })}
                className="h-10 tabular-nums"
                min={1}
                max={31}
              />
              <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {t('goals.form.monthlyDeadlineDayHint')}
              </p>
              {errors.monthlyDeadlineDay && (
                <p className="text-xs text-destructive">{errors.monthlyDeadlineDay.message}</p>
              )}
            </div>
          </div>

          {deliveriesPerPeriod !== undefined && monthlyDeadlineDay !== undefined && (
            <div className="rounded-lg border border-border/70 bg-foreground/[0.02] p-3 text-[12.5px] text-foreground">
              <p className="font-medium">{t('goals.form.preview.title')}</p>
              <p className="mt-0.5 text-muted-foreground">
                {t('goals.form.preview.body', {
                  count: Number(deliveriesPerPeriod) || 0,
                  day: Number(monthlyDeadlineDay) || 25,
                })}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="notes"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t('goals.form.notes')}
            </Label>
            <Textarea
              id="notes"
              {...register('notes')}
              rows={2}
              className="resize-none"
              placeholder={t('goals.form.notesPlaceholder')}
            />
          </div>

          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="font-semibold">
              {loading
                ? t('common.saving')
                : isEdit
                  ? t('goals.form.save')
                  : t('goals.form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
