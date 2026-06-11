import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { projectTrackingService } from '@/services/project-tracking.service';
import type { ProjectDetailResponseDto } from '@nhb-status-report/shared';
import { ProjectWeekStrip } from './project-week-strip';

interface ProjectDetailDrawerProps {
  snapshotId: string | null;
  onClose: () => void;
}

export function ProjectDetailDrawer({
  snapshotId,
  onClose,
}: ProjectDetailDrawerProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<ProjectDetailResponseDto | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!snapshotId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    projectTrackingService
      .getProjectDetail(snapshotId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [snapshotId]);

  const open = snapshotId !== null;
  const currentWeek = data
    ? (data.weekCells.findIndex((c) => c.expected && !c.sent) +
        1 || data.weekCells.length)
    : 0;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {data ? data.projectName : t('common.loading')}
          </SheetTitle>
        </SheetHeader>

        {loading || !data ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <DetailGrid data={data} />
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('projectTracking.detail.timeline')}
              </p>
              <ProjectWeekStrip
                weekFlagsBase64={data.weekFlagsBase64}
                weeksInYear={data.weekCells.length}
                currentWeek={currentWeek}
                firstActiveWeek={data.firstActiveWeek}
                projectStatus={data.projectStatus}
                size="lg"
              />
            </div>
            {data.notes && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('projectTracking.detail.notes')}
                </p>
                <p className="text-sm">{data.notes}</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailGrid({ data }: { data: ProjectDetailResponseDto }) {
  const { t } = useTranslation();
  const rows: Array<{ label: string; value: string }> = [
    { label: t('projectTracking.table.col.projectId'), value: data.projectId },
    {
      label: t('projectTracking.table.col.status'),
      value: t(`projectTracking.status.${data.projectStatus}`),
    },
    { label: 'PM', value: data.pm ?? '—' },
    {
      label: t('projectTracking.detail.responsible'),
      value: data.responsible ?? '—',
    },
    {
      label: t('projectTracking.detail.responsibleDetail'),
      value: data.responsibleDetail ?? '—',
    },
    {
      label: t('projectTracking.table.col.compliance'),
      value:
        data.compliancePercent === null
          ? '—'
          : `${data.compliancePercent.toFixed(0)}% (${data.weeksSent}/${data.weeksExpected})`,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {rows.map((row) => (
        <div key={row.label}>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {row.label}
          </p>
          <p className="font-medium">{row.value}</p>
        </div>
      ))}
    </div>
  );
}
