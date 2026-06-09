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
import type { SubmissionStatus, CompanyResponse } from '@/types';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  companyId?: string;
  onCompanyChange: (v: string | undefined) => void;
  status?: SubmissionStatus;
  onStatusChange: (v: SubmissionStatus | undefined) => void;
  companies: CompanyResponse[];
  onCreateClick?: () => void;
  hideCompanyFilter?: boolean;
  hideCreate?: boolean;
}

export function SubmissionFilters({
  search,
  onSearchChange,
  companyId,
  onCompanyChange,
  status,
  onStatusChange,
  companies,
  onCreateClick,
  hideCompanyFilter,
  hideCreate,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('statusReports.searchPlaceholder')}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>

          {!hideCompanyFilter && (
            <Select
              value={companyId ?? 'all'}
              onValueChange={(v) => onCompanyChange(v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-full sm:w-[220px] h-9 text-sm">
                <SelectValue placeholder={t('statusReports.allCompanies')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('statusReports.allCompanies')}</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.tradeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={status ?? 'all'}
            onValueChange={(v) =>
              onStatusChange(v === 'all' ? undefined : (v as SubmissionStatus))
            }
          >
            <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
              <SelectValue placeholder={t('statusReports.allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('statusReports.allStatus')}</SelectItem>
              <SelectItem value="on-time">{t('statusReports.status.onTime')}</SelectItem>
              <SelectItem value="late">{t('statusReports.status.late')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!hideCreate && onCreateClick && (
          <Button onClick={onCreateClick} size="sm" className="h-9 gap-1.5 px-4 font-semibold">
            <Plus className="h-4 w-4" />
            {t('statusReports.newSubmission')}
          </Button>
        )}
      </div>
    </div>
  );
}
