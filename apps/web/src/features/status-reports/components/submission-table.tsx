import {
  ArrowLeft,
  Building2,
  Download,
  Eye,
  Inbox,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { statusReportService } from '@/services/status-report.service';
import type { SubmissionResponse } from '@/types';

function formatDate(s: string, locale: string): string {
  return new Date(s).toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(s: string, locale: string): string {
  return new Date(s).toLocaleTimeString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
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
    { month: 'short', year: 'numeric' },
  );
}

function formatCnpj(value: string): string {
  const d = (value ?? '').replace(/\D/g, '').padEnd(14, '');
  return value && d.length === 14
    ? value
    : (value ?? '').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface FocusedCompanyContext {
  tradeName: string;
  expected: number;
  delivered: number;
  missed: number;
  late: number;
}

interface Props {
  submissions: SubmissionResponse[];
  loading: boolean;
  isAdmin: boolean;
  onView: (s: SubmissionResponse) => void;
  onEdit: (s: SubmissionResponse) => void;
  onDelete: (s: SubmissionResponse) => void;
  focusedCompany?: FocusedCompanyContext;
  onCreateSubmission?: () => void;
  onClearFocus?: () => void;
}

export function SubmissionTable({
  submissions,
  loading,
  isAdmin,
  onView,
  onEdit,
  onDelete,
  focusedCompany,
  onCreateSubmission,
  onClearFocus,
}: Props) {
  const { t, i18n } = useTranslation();

  if (loading) return <SubmissionTableSkeleton />;

  if (submissions.length === 0) {
    if (focusedCompany) {
      return (
        <FocusedEmptyState
          company={focusedCompany}
          onCreateSubmission={onCreateSubmission}
          onClearFocus={onClearFocus}
        />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center border-y border-border/60 py-16 text-center">
        <Inbox className="mb-3 h-7 w-7 text-muted-foreground/60" strokeWidth={1.6} />
        <p className="text-sm font-medium text-foreground">
          {t('statusReports.noSubmissionsFound')}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('statusReports.noSubmissionsHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="border-y border-border/60 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/60">
            <TableHead className="w-[3px] p-0" />
            <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pl-4">
              {t('statusReports.columns.company')}
            </TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('statusReports.columns.referenceMonth')}
            </TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('statusReports.columns.deliveryDate')}
            </TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('statusReports.columns.attachments')}
            </TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('statusReports.columns.submittedBy')}
            </TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('statusReports.columns.status')}
            </TableHead>
            <TableHead className="w-[40px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((s) => {
            const isOnTime = s.status === 'on-time';
            return (
              <TableRow
                key={s.id}
                className="group cursor-pointer border-border/50 transition-colors hover:bg-foreground/[0.025]"
                onClick={() => onView(s)}
              >
                {/* Status accent stripe */}
                <TableCell
                  className={cn(
                    'w-[3px] p-0',
                    isOnTime ? 'bg-emerald-500/70' : 'bg-amber-500/70',
                  )}
                />

                {/* Company */}
                <TableCell className="py-3 pl-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-semibold text-primary">
                      {s.company.tradeName
                        ? initials(s.company.tradeName)
                        : (
                          <Building2 className="h-4 w-4" strokeWidth={1.8} />
                        )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {s.company.tradeName}
                      </p>
                      <p className="text-[11px] text-muted-foreground tabular-nums truncate">
                        {formatCnpj(s.company.cnpj)}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Reference month */}
                <TableCell>
                  <span className="inline-flex items-center rounded-md bg-foreground/[0.05] px-2 py-0.5 text-xs font-medium text-foreground tabular-nums">
                    {formatMonth(s.referenceMonth, i18n.language)}
                  </span>
                </TableCell>

                {/* Delivery date */}
                <TableCell>
                  <p className="text-sm text-foreground tabular-nums leading-tight">
                    {formatDate(s.submittedAt, i18n.language)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums leading-tight">
                    {formatTime(s.submittedAt, i18n.language)}
                  </p>
                </TableCell>

                {/* Attachments */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <AttachmentsCell submission={s} />
                </TableCell>

                {/* Submitted by */}
                <TableCell className="text-sm text-muted-foreground">
                  <p className="truncate max-w-[160px]" title={s.submittedBy.name}>
                    {s.submittedBy.name}
                  </p>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold',
                      isOnTime
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        isOnTime ? 'bg-emerald-500' : 'bg-amber-500',
                      )}
                    />
                    {isOnTime
                      ? t('statusReports.status.onTime')
                      : t('statusReports.status.late')}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[170px]">
                      <DropdownMenuItem onClick={() => onView(s)} className="text-sm">
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        {t('statusReports.actions.view')}
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(s)} className="text-sm">
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            {t('statusReports.actions.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(s)}
                            className="text-sm text-destructive"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            {t('statusReports.actions.delete')}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function AttachmentsCell({ submission }: { submission: SubmissionResponse }) {
  const { t } = useTranslation();
  if (submission.attachments.length === 0) {
    return <span className="text-sm text-muted-foreground/70">—</span>;
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-foreground/[0.06]"
        >
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
          <span className="tabular-nums">{submission.attachments.length}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-1.5">
        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('statusReports.attachmentsPopover.title', {
            count: submission.attachments.length,
          })}
        </p>
        <ul className="space-y-0.5">
          {submission.attachments.map((a) => (
            <li key={a.id}>
              <a
                href={statusReportService.getAttachmentDownloadUrl(submission.id, a.id)}
                target="_blank"
                rel="noreferrer"
                className="group/item flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-foreground/[0.05]"
              >
                <Paperclip
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  strokeWidth={1.8}
                />
                <span className="truncate text-foreground">{a.filename}</span>
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground tabular-nums">
                  {formatBytes(a.sizeBytes)}
                </span>
                <Download
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100"
                  strokeWidth={1.8}
                />
              </a>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function FocusedEmptyState({
  company,
  onCreateSubmission,
  onClearFocus,
}: {
  company: FocusedCompanyContext;
  onCreateSubmission?: () => void;
  onClearFocus?: () => void;
}) {
  const { t } = useTranslation();
  const { tradeName, expected, delivered, missed, late } = company;
  return (
    <div className="border-y border-border/60 px-6 py-10">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
          <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-500" strokeWidth={1.7} />
        </div>
        <p className="text-base font-semibold text-foreground">
          {t('statusReports.focusedEmpty.title', { company: tradeName })}
        </p>
        <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
          {t('statusReports.focusedEmpty.subtitle')}
        </p>

        <dl className="mt-5 grid grid-cols-4 gap-x-6 gap-y-1 text-center">
          <Stat label={t('statusReports.focusedEmpty.expected')} value={expected} tone="neutral" />
          <Stat label={t('statusReports.focusedEmpty.delivered')} value={delivered} tone="neutral" />
          <Stat label={t('statusReports.focusedEmpty.missed')} value={missed} tone="bad" />
          <Stat label={t('statusReports.focusedEmpty.late')} value={late} tone="warn" />
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {onCreateSubmission && (
            <Button
              type="button"
              size="sm"
              onClick={onCreateSubmission}
              className="h-9 gap-1.5 px-4 font-semibold"
            >
              <Plus className="h-4 w-4" />
              {t('statusReports.focusedEmpty.create')}
            </Button>
          )}
          {onClearFocus && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onClearFocus}
              className="h-9 gap-1.5 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('statusReports.focusedEmpty.back')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'neutral' | 'warn' | 'bad';
}) {
  const toneClass =
    tone === 'warn'
      ? 'text-amber-700 dark:text-amber-400'
      : tone === 'bad'
        ? 'text-destructive'
        : 'text-foreground';
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={cn('mt-0.5 text-xl font-semibold tabular-nums', toneClass)}>{value}</dd>
    </div>
  );
}

function SubmissionTableSkeleton() {
  return (
    <div className="border-y border-border/60 overflow-hidden">
      <Table>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i} className="border-border/50">
              <TableCell className="w-[3px] p-0 bg-foreground/[0.04]" />
              <TableCell className="py-3 pl-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-md" />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-7 w-12 rounded-md" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3.5 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-md" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
