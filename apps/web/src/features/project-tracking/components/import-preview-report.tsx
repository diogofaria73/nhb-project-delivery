import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ParseReportDto } from '@nhb-status-report/shared';

interface ImportPreviewReportProps {
  report: ParseReportDto;
}

export function ImportPreviewReport({ report }: ImportPreviewReportProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('summary');

  const biCount = report.biSanity.warnings.length;
  const deltaCount =
    report.delta.addedProjects.length +
    report.delta.removedProjects.length +
    report.delta.statusChanges.length;

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="summary">
          {t('projectTracking.import.tabs.summary')}
        </TabsTrigger>
        <TabsTrigger value="delta">
          {t('projectTracking.import.tabs.delta')} ({deltaCount})
        </TabsTrigger>
        <TabsTrigger value="bi">
          {t('projectTracking.import.tabs.bi')} ({biCount})
        </TabsTrigger>
        <TabsTrigger value="errors">
          {t('projectTracking.import.tabs.errors')} ({report.rowsRejected})
        </TabsTrigger>
        <TabsTrigger value="skipped">
          {t('projectTracking.import.tabs.skipped')} ({report.rowsSkipped})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="space-y-3">
        <SummaryGrid report={report} />
        <PreviewTable report={report} />
      </TabsContent>

      <TabsContent value="delta" className="space-y-3">
        <DeltaPanel report={report} />
      </TabsContent>

      <TabsContent value="bi" className="space-y-3">
        {!report.biSanity.available ? (
          <p className="text-sm text-muted-foreground">
            {t('projectTracking.import.bi.notAvailable')}
          </p>
        ) : biCount === 0 ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {t('projectTracking.import.bi.allGreen')}
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {report.biSanity.warnings.map((w, i) => (
              <li
                key={i}
                className="rounded border-l-2 border-amber-500 bg-amber-500/10 px-2 py-1"
              >
                {w}
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="skipped" className="space-y-3">
        <SkippedPanel report={report} />
      </TabsContent>

      <TabsContent value="errors" className="space-y-3">
        {report.rowsRejected === 0 ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {t('projectTracking.import.errors.none')}
          </p>
        ) : (
          <>
            {report.errorsTruncated && (
              <p className="text-xs text-muted-foreground">
                {t('projectTracking.import.errors.truncated')}
              </p>
            )}
            <ul className="space-y-1 text-sm">
              {report.errors.map((err, i) => (
                <li
                  key={i}
                  className="rounded border-l-2 border-rose-500 bg-rose-500/10 px-2 py-1"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    L{err.rowNumber}
                  </span>{' '}
                  {err.projectId && (
                    <span className="font-mono text-xs">{err.projectId} —</span>
                  )}{' '}
                  {err.reason}
                </li>
              ))}
            </ul>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

function SummaryGrid({ report }: { report: ParseReportDto }) {
  const { t } = useTranslation();
  const cards = [
    { label: t('projectTracking.import.summary.rowsRead'), value: report.totalRowsRead },
    { label: t('projectTracking.import.summary.accepted'), value: report.rowsAccepted },
    { label: t('projectTracking.import.summary.skipped'), value: report.rowsSkipped },
    { label: t('projectTracking.import.summary.rejected'), value: report.rowsRejected },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded border bg-muted/20 px-3 py-2"
        >
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {c.label}
          </p>
          <p className="text-lg font-semibold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function PreviewTable({ report }: { report: ParseReportDto }) {
  const { t } = useTranslation();
  if (report.preview.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('projectTracking.import.preview.empty')}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded border">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5">ID</th>
            <th className="px-2 py-1.5">{t('projectTracking.table.col.projectName')}</th>
            <th className="px-2 py-1.5">{t('projectTracking.table.col.status')}</th>
            <th className="px-2 py-1.5 text-right">{t('projectTracking.table.col.compliance')}</th>
          </tr>
        </thead>
        <tbody>
          {report.preview.map((row) => (
            <tr key={row.projectId} className="border-t">
              <td className="px-2 py-1.5 font-mono text-xs">{row.projectId}</td>
              <td className="px-2 py-1.5">{row.projectName}</td>
              <td className="px-2 py-1.5 text-xs">
                {t(`projectTracking.status.${row.projectStatus}`)}
              </td>
              <td className="px-2 py-1.5 text-right text-xs">
                {row.weeksSent} / {row.weeksExpected}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeltaPanel({ report }: { report: ParseReportDto }) {
  const { t } = useTranslation();
  if (!report.delta.hasPrevious) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('projectTracking.import.delta.firstImport')}
      </p>
    );
  }
  return (
    <div className="space-y-3 text-sm">
      <DeltaSection
        title={t('projectTracking.import.delta.added')}
        items={report.delta.addedProjects.map(
          (p) => `${p.projectId} — ${p.projectName}`,
        )}
      />
      <DeltaSection
        title={t('projectTracking.import.delta.removed')}
        items={report.delta.removedProjects.map(
          (p) => `${p.projectId} — ${p.projectName}`,
        )}
      />
      <DeltaSection
        title={t('projectTracking.import.delta.statusChanged')}
        items={report.delta.statusChanges.map(
          (c) =>
            `${c.projectId}: ${t(`projectTracking.status.${c.from}`)} → ${t(`projectTracking.status.${c.to}`)}`,
        )}
      />
      <WeeklyDelta
        added={report.delta.weeklyOksAdded}
        removed={report.delta.weeklyOksRemoved}
      />
    </div>
  );
}

function DeltaSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title} ({items.length})
      </p>
      <ul className="space-y-0.5 text-sm">
        {items.map((it, i) => (
          <li key={i} className="font-mono text-xs">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkippedPanel({ report }: { report: ParseReportDto }) {
  const { t } = useTranslation();
  const skippedRows = report.skippedRows ?? [];
  const skippedRowsTruncated = report.skippedRowsTruncated ?? false;

  if (report.rowsSkipped === 0) {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-300">
        {t('projectTracking.import.skipped.none')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {t('projectTracking.import.skipped.rule')}
      </p>
      {skippedRowsTruncated && (
        <p className="text-xs text-muted-foreground">
          {t('projectTracking.import.skipped.truncated')}
        </p>
      )}
      {skippedRows.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t('projectTracking.import.skipped.noDetail', {
            count: report.rowsSkipped,
          })}
        </p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {skippedRows.map((row) => (
            <li
              key={row.rowNumber}
              className="rounded border-l-2 border-amber-500 bg-amber-500/10 px-2 py-1.5"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  L{row.rowNumber}
                </span>
                <span className="text-xs text-muted-foreground">
                  {row.sampleCells.length === 0
                    ? t('projectTracking.import.skipped.fullyEmpty')
                    : t('projectTracking.import.skipped.idAndNameEmpty')}
                </span>
              </div>
              {row.sampleCells.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {row.sampleCells.map((c, i) => (
                    <span
                      key={i}
                      className="inline-flex max-w-full items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px]"
                    >
                      <span className="font-medium text-muted-foreground">
                        {c.header}:
                      </span>
                      <span className="font-mono">{c.value}</span>
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WeeklyDelta({ added, removed }: { added: number[]; removed: number[] }) {
  const { t } = useTranslation();
  const nonZero = added
    .map((a, i) => ({ week: i + 1, added: a, removed: removed[i] ?? 0 }))
    .filter((x) => x.added !== 0 || x.removed !== 0);
  if (nonZero.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t('projectTracking.import.delta.weeklyOks')}
      </p>
      <div className="flex flex-wrap gap-1">
        {nonZero.map((x) => (
          <span key={x.week} className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
            S{x.week}{' '}
            {x.added > 0 && (
              <span className="text-emerald-700 dark:text-emerald-300">+{x.added}</span>
            )}
            {x.removed > 0 && (
              <span className="ml-1 text-rose-700 dark:text-rose-300">-{x.removed}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
