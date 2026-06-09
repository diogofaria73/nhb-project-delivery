import { useMemo, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MonthPickerProps {
  value?: string; // YYYY-MM
  onChange: (value: string) => void;
  min?: string; // YYYY-MM
  max?: string; // YYYY-MM
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  locale?: string;
  yearRange?: number; // how many years to show before today
}

function parse(value?: string): { year: number; month: number } | null {
  if (!value) return null;
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function compareYM(a: { year: number; month: number }, b: { year: number; month: number }): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

const MONTH_KEYS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MONTH_KEYS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function monthLabel(month: number, locale: string): string {
  const list = locale === 'pt-BR' ? MONTH_KEYS_PT : MONTH_KEYS_EN;
  return list[month - 1] ?? '';
}

function monthShort(month: number, locale: string): string {
  return monthLabel(month, locale).slice(0, 3);
}

export function MonthPicker({
  value,
  onChange,
  min,
  max,
  disabled,
  placeholder,
  className,
  id,
  locale = 'en-US',
  yearRange = 8,
}: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parse(value);
  const today = useMemo(() => {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  }, []);
  const minYM = parse(min);
  const maxYM = parse(max);

  const [viewYear, setViewYear] = useState<number>(parsed?.year ?? today.year);

  const years = useMemo(() => {
    const list: number[] = [];
    const start = (maxYM?.year ?? today.year) - yearRange + 1;
    const end = maxYM?.year ?? today.year + 1;
    for (let y = start; y <= end; y += 1) list.push(y);
    return list;
  }, [maxYM, today.year, yearRange]);

  function setMonth(month: number) {
    const candidate = { year: viewYear, month };
    if (minYM && compareYM(candidate, minYM) < 0) return;
    if (maxYM && compareYM(candidate, maxYM) > 0) return;
    onChange(`${candidate.year}-${pad(candidate.month)}`);
    setOpen(false);
  }

  const isDisabledMonth = (month: number): boolean => {
    const candidate = { year: viewYear, month };
    if (minYM && compareYM(candidate, minYM) < 0) return true;
    if (maxYM && compareYM(candidate, maxYM) > 0) return true;
    return false;
  };

  const display = parsed
    ? `${monthShort(parsed.month, locale)}/${parsed.year}`
    : placeholder ?? '';

  return (
    <Popover open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-start gap-2 px-3 font-normal tabular-nums',
            !parsed && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {display}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-3" align="start">
        <div className="mb-2 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setViewYear((y) => y - 1)}
            disabled={minYM ? viewYear - 1 < minYM.year : false}
          >
            ‹
          </Button>
          <select
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setViewYear((y) => y + 1)}
            disabled={maxYM ? viewYear + 1 > maxYM.year : false}
          >
            ›
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const selected = parsed && parsed.year === viewYear && parsed.month === m;
            const isCurrent = today.year === viewYear && today.month === m;
            const disabledMonth = isDisabledMonth(m);
            return (
              <Button
                key={m}
                type="button"
                variant={selected ? 'default' : 'ghost'}
                size="sm"
                disabled={disabledMonth}
                onClick={() => setMonth(m)}
                className={cn(
                  'h-9 text-xs font-medium',
                  !selected && isCurrent && 'border border-border/80',
                )}
              >
                {monthShort(m, locale)}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
