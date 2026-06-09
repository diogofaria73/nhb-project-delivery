import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CompanyCompliance } from '@/types';

interface Props {
  data: CompanyCompliance[];
  loading: boolean;
  onCompanyOpen?: (companyId: string) => void;
}

const bandClasses: Record<CompanyCompliance['band'], string> = {
  green: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  red: 'bg-destructive/15 text-destructive',
};

export function CompanyComplianceTable({ data, loading, onCompanyOpen }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const hasAnyDelivery = data.some((c) => c.onTime + c.late > 0);
  if (data.length === 0 || !hasAnyDelivery) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-12">
        <p className="text-sm font-medium text-muted-foreground">
          {hasAnyDelivery
            ? t('statusReportAnalytics.companies.empty')
            : t('statusReportAnalytics.companies.noDeliveries')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-5">
              {t('statusReportAnalytics.companies.columns.company')}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
              {t('statusReportAnalytics.companies.columns.expected')}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
              {t('statusReportAnalytics.companies.columns.onTime')}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
              {t('statusReportAnalytics.companies.columns.late')}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
              {t('statusReportAnalytics.companies.columns.missed')}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
              {t('statusReportAnalytics.companies.columns.score')}
            </TableHead>
            {onCompanyOpen && (
              <TableHead className="w-12 pr-5" />
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const clickable = Boolean(onCompanyOpen);
            return (
              <TableRow
                key={row.companyId}
                className={cn(
                  'border-border/70',
                  clickable && 'cursor-pointer transition-colors hover:bg-foreground/[0.02]',
                )}
                onClick={clickable ? () => onCompanyOpen?.(row.companyId) : undefined}
              >
                <TableCell className="py-3 pl-5 text-sm font-medium text-foreground">
                  {row.tradeName}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground text-right tabular-nums">
                  {row.expected}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground text-right tabular-nums">
                  {row.onTime}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground text-right tabular-nums">
                  {row.late}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground text-right tabular-nums">
                  {row.missed}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs font-semibold rounded-md px-2.5 py-0.5 border-0 tabular-nums',
                      bandClasses[row.band],
                    )}
                  >
                    {(row.score * 100).toFixed(0)}%
                  </Badge>
                </TableCell>
                {clickable && (
                  <TableCell className="pr-5 text-right">
                    <span
                      title={t('statusReportAnalytics.companies.openSubmissions')}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </span>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
