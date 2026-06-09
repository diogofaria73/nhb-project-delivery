import { cn } from '@/lib/utils';

interface Props {
  value: number; // 0..1
  size?: number; // px
  stroke?: number;
  label?: string;
  className?: string;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
}

const toneClasses: Record<NonNullable<Props['tone']>, string> = {
  good: 'text-emerald-500',
  warn: 'text-amber-500',
  bad: 'text-destructive',
  neutral: 'text-foreground',
};

export function CircularProgress({
  value,
  size = 96,
  stroke = 8,
  label,
  className,
  tone = 'neutral',
}: Props) {
  const clamped = Math.max(0, Math.min(1, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          className={toneClasses[tone]}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {Math.round(clamped * 100)}%
        </span>
        {label && <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
