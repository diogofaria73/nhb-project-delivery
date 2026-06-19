import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface InfoTooltipProps {
  title: string;
  formula: string;
  description: string;
  size?: number;
}

export function InfoTooltip({
  title,
  formula,
  description,
  size = 14,
}: InfoTooltipProps) {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('dashboard.info.ariaLabel')}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size + 6,
            height: size + 6,
            borderRadius: 999,
            color: 'var(--hy-ink-faint)',
            transition: 'color .15s ease, background .15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--hy-teal-bright)';
            e.currentTarget.style.background = 'rgba(98, 179, 168, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--hy-ink-faint)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Info size={size} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="hy-popover"
        style={{
          padding: 14,
          maxWidth: 320,
          fontSize: 12.5,
          lineHeight: 1.5,
          color: 'var(--hy-ink)',
          background: 'var(--hy-panel)',
          backdropFilter: 'none',
          boxShadow: '0 18px 48px rgba(0, 0, 0, 0.55)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.12em',
            color: 'var(--hy-teal-bright)',
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            color: 'var(--hy-ink-dim)',
            marginBottom: 4,
          }}
        >
          {t('dashboard.info.formulaLabel')}
        </div>
        <div
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: 12,
            background: 'var(--hy-section-bg)',
            border: '1px solid var(--hy-line)',
            padding: '6px 10px',
            borderRadius: 6,
            marginBottom: 10,
            color: 'var(--hy-ink)',
          }}
        >
          {formula}
        </div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            color: 'var(--hy-ink-dim)',
            marginBottom: 4,
          }}
        >
          {t('dashboard.info.descriptionLabel')}
        </div>
        <div style={{ color: 'var(--hy-ink-dim)' }}>{description}</div>
      </PopoverContent>
    </Popover>
  );
}
