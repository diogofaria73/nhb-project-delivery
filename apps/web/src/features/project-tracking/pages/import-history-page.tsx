import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Download, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { projectTrackingService } from '@/services/project-tracking.service';
import { useImportHistory } from '../hooks/use-import-history';
import type { ProjectImportResponseDto } from '@nhb-status-report/shared';

export function ImportHistoryPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ page, limit: 20 }), [page]);
  const { data, total, totalPages, loading, refetch } = useImportHistory(params);
  const [confirm, setConfirm] = useState<
    | { type: 'restore' | 'delete'; record: ProjectImportResponseDto }
    | null
  >(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function doRestore(record: ProjectImportResponseDto) {
    setBusyId(record.id);
    try {
      await projectTrackingService.restoreImport(record.id);
      toast.success(t('projectTracking.history.restoredToast'));
      refetch();
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ?? 'Restore failed',
      );
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  }

  async function doDelete(record: ProjectImportResponseDto) {
    setBusyId(record.id);
    try {
      await projectTrackingService.deleteImport(record.id);
      toast.success(t('projectTracking.history.deletedToast'));
      refetch();
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ?? 'Delete failed',
      );
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <p
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '.18em',
            color: 'var(--hy-teal-bright)',
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Auditoria
        </p>
        <h1
          className="hy-display"
          style={{
            fontSize: 32,
            margin: 0,
            color: 'var(--hy-ink)',
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
          }}
        >
          {t('projectTracking.history.title')}
        </h1>
        <p
          style={{
            marginTop: 8,
            fontSize: 13.5,
            color: 'var(--hy-ink-dim)',
            lineHeight: 1.5,
          }}
        >
          {t('projectTracking.history.subtitle', { total })}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-5">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : data.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              {t('projectTracking.history.empty')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">{t('projectTracking.history.col.year')}</th>
                    <th className="px-3 py-2">{t('projectTracking.history.col.status')}</th>
                    <th className="px-3 py-2">{t('projectTracking.history.col.filename')}</th>
                    <th className="px-3 py-2 text-right">{t('projectTracking.history.col.rows')}</th>
                    <th className="px-3 py-2">{t('projectTracking.history.col.importedAt')}</th>
                    <th className="px-3 py-2">{t('projectTracking.history.col.importedBy')}</th>
                    <th className="px-3 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => {
                    const busy = busyId === row.id;
                    return (
                      <tr key={row.id} className="border-b">
                        <td className="px-3 py-2 font-mono text-xs">{row.referenceYear}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-3 py-2 max-w-[280px] truncate font-mono text-xs">
                          {row.originalFilename}
                        </td>
                        <td className="px-3 py-2 text-right text-xs">
                          {row.rowsAccepted}
                          {row.rowsRejected > 0 && (
                            <span className="ml-1 text-rose-600">/ {row.rowsRejected}✕</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {new Date(row.importedAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-xs">{row.importedByName}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title={t('projectTracking.history.action.download')}
                            >
                              <a
                                href={projectTrackingService.downloadFileUrl(row.id)}
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            {row.status === 'SUPERSEDED' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={busy}
                                onClick={() =>
                                  setConfirm({ type: 'restore', record: row })
                                }
                                title={t('projectTracking.history.action.restore')}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            {row.status !== 'ACTIVE' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={busy}
                                onClick={() =>
                                  setConfirm({ type: 'delete', record: row })
                                }
                                title={t('projectTracking.history.action.delete')}
                              >
                                <Trash2 className="h-4 w-4 text-rose-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('common.previous')}
          </Button>
          <p className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t('common.next')}
          </Button>
        </div>
      )}

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === 'restore'
                ? t('projectTracking.history.confirmRestoreTitle')
                : t('projectTracking.history.confirmDeleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === 'restore'
                ? t('projectTracking.history.confirmRestoreBody', {
                    file: confirm?.record.originalFilename,
                  })
                : t('projectTracking.history.confirmDeleteBody', {
                    file: confirm?.record.originalFilename,
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirm) return;
                if (confirm.type === 'restore') doRestore(confirm.record);
                else doDelete(confirm.record);
              }}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectImportResponseDto['status'] }) {
  const { t } = useTranslation();
  const color =
    status === 'ACTIVE'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : status === 'SUPERSEDED'
        ? 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300'
        : 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${color}`}
    >
      {t(`projectTracking.history.statusLabels.${status}`)}
    </span>
  );
}
