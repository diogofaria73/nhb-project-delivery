import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { projectTrackingService } from '@/services/project-tracking.service';
import type { ParseReportDto } from '@nhb-status-report/shared';
import { ImportPreviewReport } from './import-preview-report';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialYear: number;
  onImported: () => void;
}

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MAX_BYTES = 10 * 1024 * 1024;

export function ImportDialog({
  open,
  onOpenChange,
  initialYear,
  onImported,
}: ImportDialogProps) {
  const { t } = useTranslation();
  const fileRef = useRef<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [referenceYear, setReferenceYear] = useState(initialYear);
  const [report, setReport] = useState<ParseReportDto | null>(null);
  const [phase, setPhase] = useState<'pick' | 'preview' | 'confirming'>('pick');
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!open) {
      fileRef.current = null;
      setFileName(null);
      setReport(null);
      setError(null);
      setPhase('pick');
      setReferenceYear(initialYear);
    }
  }, [open, initialYear]);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError(t('projectTracking.import.errors.extension'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t('projectTracking.import.errors.size'));
      return;
    }
    fileRef.current = file;
    setFileName(file.name);
  }, [t]);

  async function runPreview() {
    if (!fileRef.current) return;
    setPreviewing(true);
    setError(null);
    try {
      const result = await projectTrackingService.previewImport(
        fileRef.current,
        referenceYear,
      );
      setReport(result);
      setPhase('preview');
    } catch (err) {
      const message =
        (err as { message?: string | string[] })?.message ??
        'Preview failed';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setPreviewing(false);
    }
  }

  async function runConfirm() {
    if (!fileRef.current || !report) return;
    setPhase('confirming');
    setError(null);
    try {
      const result = await projectTrackingService.confirmImport(
        fileRef.current,
        referenceYear,
        report.sha256,
      );
      toast.success(
        t('projectTracking.import.success', {
          count: result.rowsAccepted,
          filename: report.originalFilename,
          year: referenceYear,
        }),
      );
      onImported();
      onOpenChange(false);
    } catch (err) {
      const message =
        (err as { message?: string | string[] })?.message ??
        'Confirm failed';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
      setPhase('preview');
    }
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('projectTracking.import.title')}</DialogTitle>
          <DialogDescription>
            {t('projectTracking.import.description')}
          </DialogDescription>
        </DialogHeader>

        {phase === 'pick' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referenceYear">
                {t('projectTracking.import.referenceYear')}
              </Label>
              <Input
                id="referenceYear"
                type="number"
                min={2024}
                max={2099}
                value={referenceYear}
                onChange={(e) => setReferenceYear(Number(e.target.value))}
                className="max-w-[160px]"
              />
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragOver
                  ? 'border-foreground/40 bg-muted/40'
                  : 'border-border bg-muted/10'
              }`}
            >
              <p className="text-sm font-medium">
                {fileName ?? t('projectTracking.import.dropHint')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('projectTracking.import.extensions')}
              </p>
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                id="project-tracking-file-picker"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() =>
                  document
                    .getElementById('project-tracking-file-picker')
                    ?.click()
                }
              >
                {t('projectTracking.import.choose')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('projectTracking.import.sheetsHint')}
            </p>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={runPreview}
                disabled={!fileRef.current || previewing}
              >
                {previewing
                  ? t('projectTracking.import.previewing')
                  : t('projectTracking.import.next')}
              </Button>
            </div>
          </div>
        )}

        {phase !== 'pick' && report && (
          <div className="space-y-4">
            <ImportPreviewReport report={report} />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex justify-between gap-2">
              <Button
                variant="ghost"
                onClick={() => setPhase('pick')}
                disabled={phase === 'confirming'}
              >
                {t('projectTracking.import.back')}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={runConfirm}
                  disabled={phase === 'confirming'}
                >
                  {phase === 'confirming'
                    ? t('projectTracking.import.confirming')
                    : t('projectTracking.import.confirm')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { XLSX_MIME };
