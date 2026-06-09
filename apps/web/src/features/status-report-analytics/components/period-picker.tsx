import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { MonthPicker } from '@/components/ui/month-picker';

interface Props {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}

export function PeriodPicker({ from, to, onChange }: Props) {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('statusReportAnalytics.period.from')}
        </Label>
        <MonthPicker
          value={from}
          max={to}
          onChange={(v) => onChange({ from: v, to })}
          locale={i18n.language}
          className="h-9 w-[170px]"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('statusReportAnalytics.period.to')}
        </Label>
        <MonthPicker
          value={to}
          min={from}
          onChange={(v) => onChange({ from, to: v })}
          locale={i18n.language}
          className="h-9 w-[170px]"
        />
      </div>
    </div>
  );
}
