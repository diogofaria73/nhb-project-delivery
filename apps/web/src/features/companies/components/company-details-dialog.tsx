import { useTranslation } from 'react-i18next';
import { Building2, Pencil, Power, PowerOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPhone } from '@/lib/phone';
import type { CompanyResponse } from '@/types';

interface CompanyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyResponse | null;
  onEdit: (company: CompanyResponse) => void;
  onToggleStatus: (company: CompanyResponse) => void;
}

function formatDate(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

export function CompanyDetailsDialog({
  open,
  onOpenChange,
  company,
  onEdit,
  onToggleStatus,
}: CompanyDetailsDialogProps) {
  const { t, i18n } = useTranslation();

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-base font-semibold">{company.tradeName}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">
                {company.legalName}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  company.isActive ? 'bg-emerald-500' : 'bg-destructive',
                )}
              />
              <span className="text-xs font-normal text-muted-foreground">
                {company.isActive ? t('companies.active') : t('companies.inactive')}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <Field label={t('companies.columns.cnpj')} value={<span className="tabular-nums">{company.cnpjFormatted}</span>} />
          <Field label={t('companies.form.contactEmail')} value={company.contactEmail} />
          <Field
            label={t('companies.form.contactPhone')}
            value={
              <span className="tabular-nums">
                {company.contactPhone ? formatPhone(company.contactPhone) : ''}
              </span>
            }
          />
          <Field label={t('companies.columns.created')} value={formatDate(company.createdAt, i18n.language)} />
          <div className="col-span-2">
            <Field
              label={t('companies.form.notes')}
              value={
                <span className="whitespace-pre-wrap">{company.notes ?? ''}</span>
              }
            />
          </div>
          <div className="col-span-2">
            <Field
              label={t('companies.details.updatedAt')}
              value={formatDate(company.updatedAt, i18n.language)}
            />
          </div>
        </div>

        <DialogFooter className="pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(company)}
          >
            {company.isActive ? (
              <>
                <PowerOff className="mr-2 h-3.5 w-3.5" />
                {t('companies.actions.deactivate')}
              </>
            ) : (
              <>
                <Power className="mr-2 h-3.5 w-3.5" />
                {t('companies.actions.activate')}
              </>
            )}
          </Button>
          <Button type="button" size="sm" className="font-semibold" onClick={() => onEdit(company)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            {t('companies.actions.edit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
