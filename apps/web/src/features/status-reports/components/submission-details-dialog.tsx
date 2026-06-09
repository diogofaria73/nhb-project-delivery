import { Download, Paperclip, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { statusReportService } from '@/services/status-report.service';
import type { SubmissionResponse } from '@/types';

function formatDate(s: string, locale: string): string {
  return new Date(s).toLocaleString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMonth(ym: string, locale: string): string {
  const parts = ym.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
    locale === 'pt-BR' ? 'pt-BR' : 'en-US',
    { month: 'long', year: 'numeric' },
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  submission: SubmissionResponse | null;
  isAdmin: boolean;
  onEdit: (s: SubmissionResponse) => void;
  onDelete: (s: SubmissionResponse) => void;
}

export function SubmissionDetailsDialog({
  open,
  onOpenChange,
  submission,
  isAdmin,
  onEdit,
  onDelete,
}: Props) {
  const { t, i18n } = useTranslation();

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">
                {submission.company.tradeName}
              </p>
              <p className="truncate text-xs font-normal text-muted-foreground">
                {submission.company.legalName}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                'text-xs font-medium rounded-md px-2.5 py-0.5 border-0 shrink-0',
                submission.status === 'on-time'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
              )}
            >
              {submission.status === 'on-time'
                ? t('statusReports.status.onTime')
                : t('statusReports.status.late')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <Field
            label={t('statusReports.columns.referenceMonth')}
            value={formatMonth(submission.referenceMonth, i18n.language)}
          />
          <Field
            label={t('statusReports.columns.deliveryDate')}
            value={formatDate(submission.submittedAt, i18n.language)}
          />
          <Field label={t('statusReports.columns.deliveryEmail')} value={submission.deliveryEmail} />
          <Field label={t('statusReports.columns.submittedBy')} value={submission.submittedBy.name} />
          <div className="col-span-2">
            <Field
              label={t('statusReports.form.notes')}
              value={
                <span className="whitespace-pre-wrap">{submission.notes ?? ''}</span>
              }
            />
          </div>

          <div className="col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {t('statusReports.form.attachments')}
            </p>
            {submission.attachments.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {t('statusReports.details.noAttachments')}
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {submission.attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-border/70 bg-card px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{a.filename}</span>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        ({formatBytes(a.sizeBytes)})
                      </span>
                    </div>
                    <a
                      href={statusReportService.getAttachmentDownloadUrl(submission.id, a.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-border/70 px-2.5 text-xs font-medium hover:bg-foreground/[0.04]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t('statusReports.details.download')}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {isAdmin && (
          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDelete(submission)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              {t('statusReports.actions.delete')}
            </Button>
            <Button type="button" size="sm" className="font-semibold" onClick={() => onEdit(submission)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              {t('statusReports.actions.edit')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground break-words">{value || '—'}</p>
    </div>
  );
}
