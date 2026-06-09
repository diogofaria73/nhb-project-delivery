import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function SubmissionPagination({ page, totalPages, total, onPageChange }: Props) {
  const { t } = useTranslation();
  if (totalPages <= 0) return null;

  const from = (page - 1) * 20 + 1;
  const to = Math.min(page * 20, total);

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground/70 tabular-nums">
        {t('statusReports.pagination.showing', { from, to, total })}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs font-medium tabular-nums px-2 text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
