import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ProjectWeekStripProps {
  weekFlagsBase64: string;
  weeksInYear: number;
  currentWeek: number;
  firstActiveWeek: number | null;
  projectStatus: string;
  size?: 'sm' | 'lg';
  onCellHover?: (week: number, sent: boolean, expected: boolean) => void;
}

function decodeFlags(base64: string): boolean[] {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const flags: boolean[] = [];
    for (let week = 1; week <= 53; week++) {
      const byteIdx = Math.floor((week - 1) / 8);
      const bit = (week - 1) % 8;
      const byte = bytes[byteIdx] ?? 0;
      flags.push((byte & (1 << bit)) !== 0);
    }
    return flags;
  } catch {
    return new Array<boolean>(53).fill(false);
  }
}

export function ProjectWeekStrip({
  weekFlagsBase64,
  weeksInYear,
  currentWeek,
  firstActiveWeek,
  projectStatus,
  size = 'sm',
  onCellHover,
}: ProjectWeekStripProps) {
  const flags = useMemo(() => decodeFlags(weekFlagsBase64), [weekFlagsBase64]);

  const isActive = projectStatus === 'ACTIVE';
  const startWeek = firstActiveWeek ?? 1;

  const cells = [];
  for (let week = 1; week <= weeksInYear; week++) {
    const sent = flags[week - 1] ?? false;
    const expected =
      isActive && week >= startWeek && week <= currentWeek && currentWeek > 0;
    let className = 'bg-zinc-200 dark:bg-zinc-800';
    if (sent) {
      className = 'bg-emerald-500';
    } else if (expected) {
      className = 'bg-rose-500/70';
    }
    cells.push(
      <button
        key={week}
        type="button"
        onMouseEnter={() => onCellHover?.(week, sent, expected)}
        onFocus={() => onCellHover?.(week, sent, expected)}
        title={`Sem ${week}${sent ? ' — enviado' : expected ? ' — esperado' : ''}`}
        className={cn(
          'shrink-0 rounded-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          size === 'lg' ? 'h-5 w-3.5' : 'h-3 w-2',
          className,
        )}
      />,
    );
  }

  return (
    <div
      className={cn(
        'flex items-center',
        size === 'lg' ? 'gap-0.5' : 'gap-px',
      )}
    >
      {cells}
    </div>
  );
}
