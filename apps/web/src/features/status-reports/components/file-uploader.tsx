import { useRef } from 'react';
import { Paperclip, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_TOTAL = 50 * 1024 * 1024;
const ALLOWED = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/csv',
  'image/png',
  'image/jpeg',
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  onError: (message: string) => void;
}

export function FileUploader({ files, onChange, onError }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: FileList | File[]) {
    const list = Array.from(incoming);
    const next = [...files];
    for (const file of list) {
      if (!ALLOWED.includes(file.type)) {
        onError(t('statusReports.upload.errors.invalidType', { name: file.name }));
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        onError(t('statusReports.upload.errors.tooLarge', { name: file.name }));
        continue;
      }
      next.push(file);
    }
    const total = next.reduce((sum, f) => sum + f.size, 0);
    if (total > MAX_TOTAL) {
      onError(t('statusReports.upload.errors.totalExceeded'));
      return;
    }
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 p-6 transition-colors hover:border-foreground/30 hover:bg-muted/60"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
      >
        <Upload className="mb-2 h-5 w-5 text-muted-foreground" strokeWidth={1.7} />
        <p className="text-[13px] text-foreground font-medium">
          {t('statusReports.upload.dropHere')}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {t('statusReports.upload.hint')}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 h-8 text-xs"
          onClick={() => inputRef.current?.click()}
        >
          {t('statusReports.upload.browse')}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept={ALLOWED.join(',')}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-md border border-border/70 bg-card px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  ({formatBytes(file.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
                aria-label={t('common.remove')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
