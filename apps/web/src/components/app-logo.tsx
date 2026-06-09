import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
  variant?: 'symbol' | 'full';
}

export function AppLogo({ className, variant = 'symbol' }: AppLogoProps) {
  if (variant === 'full') {
    return (
      <span className={cn('inline-flex items-center gap-2 shrink-0', className)}>
        <img
          src="/app-logo.png"
          alt="NHB Status Report"
          className="h-7 w-7 shrink-0 object-contain dark:brightness-0 dark:invert"
        />
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          NHB Status Report
        </span>
      </span>
    );
  }

  return (
    <img
      src="/app-logo.png"
      alt="NHB Status Report"
      className={cn('h-8 w-8 shrink-0 object-contain dark:brightness-0 dark:invert', className)}
    />
  );
}
