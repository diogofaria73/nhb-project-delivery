import { MoreHorizontal, Pencil, Building2, Power, PowerOff, Eye } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CompanyResponse } from '@/types';

function formatDate(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface CompanyTableProps {
  companies: CompanyResponse[];
  loading: boolean;
  onEdit: (company: CompanyResponse) => void;
  onView: (company: CompanyResponse) => void;
  onToggleStatus: (company: CompanyResponse) => void;
}

export function CompanyTable({
  companies,
  loading,
  onEdit,
  onView,
  onToggleStatus,
}: CompanyTableProps) {
  const { t, i18n } = useTranslation();

  if (loading) return <CompanyTableSkeleton />;

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
        <Building2 className="mb-3 h-7 w-7 text-muted-foreground/60" strokeWidth={1.6} />
        <p className="text-sm font-medium text-muted-foreground">
          {t('companies.noCompaniesFound')}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t('companies.noCompaniesHint')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-5">
              {t('companies.columns.tradeName')}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('companies.columns.legalName')}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('companies.columns.cnpj')}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('companies.columns.contactEmail')}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('companies.columns.status')}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('companies.columns.created')}
            </TableHead>
            <TableHead className="w-[48px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow
              key={company.id}
              className={cn(
                'group transition-colors border-border/70 cursor-pointer',
                !company.isActive && 'opacity-50',
              )}
              onClick={() => onView(company)}
            >
              <TableCell className="py-3.5 pl-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">
                    {company.tradeName}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">
                {company.legalName}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground tabular-nums">
                {company.cnpjFormatted}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {company.contactEmail}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      company.isActive ? 'bg-emerald-500' : 'bg-destructive',
                    )}
                  />
                  <span className="text-sm text-muted-foreground">
                    {company.isActive ? t('companies.active') : t('companies.inactive')}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground tabular-nums">
                {formatDate(company.createdAt, i18n.language)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem onClick={() => onView(company)} className="text-sm">
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      {t('companies.actions.view')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(company)} className="text-sm">
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      {t('companies.actions.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleStatus(company)} className="text-sm">
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
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CompanyTableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <TableHead
                key={i}
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                &mdash;
              </TableHead>
            ))}
            <TableHead className="w-[48px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i} className="border-border/70">
              <TableCell className="py-3.5 pl-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
