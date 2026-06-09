import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Globe2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { companyService } from '@/services/company.service';
import type { CompanyResponse } from '@/types';

interface Props {
  companyId?: string;
  onChange: (companyId: string | undefined) => void;
}

export function ScopeFilter({ companyId, onChange }: Props) {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    companyService
      .listCompanies({ page: 1, limit: 200 })
      .then((res) => {
        if (!cancelled) setCompanies(res.data);
      })
      .catch(() => {
        if (!cancelled) setCompanies([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('statusReportAnalytics.scope.label')}
      </Label>
      <Select
        value={companyId ?? 'all'}
        onValueChange={(v) => onChange(v === 'all' ? undefined : v)}
        disabled={loading}
      >
        <SelectTrigger className="h-9 w-full sm:w-[240px] text-sm">
          <SelectValue placeholder={t('statusReportAnalytics.scope.global')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="inline-flex items-center gap-2">
              <Globe2 className="h-3.5 w-3.5" />
              {t('statusReportAnalytics.scope.global')}
            </span>
          </SelectItem>
          {companies.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                {c.tradeName}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
