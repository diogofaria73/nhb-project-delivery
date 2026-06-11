import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import type { ProjectStatus } from '@nhb-status-report/shared';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { STATUS_COLORS, STATUS_ORDER } from './status-meta';

interface StatusMultiSelectProps {
  selected: Set<ProjectStatus>;
  onToggle: (status: ProjectStatus) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export function StatusMultiSelect({
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
}: StatusMultiSelectProps) {
  const { t } = useTranslation();
  const isAll = STATUS_ORDER.every((s) => selected.has(s));
  const summary = isAll
    ? t('dashboard.filters.allLabel')
    : t('dashboard.filters.partialLabel', { n: selected.size });

  const canClear = selected.size > 0 && !isAll;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="hy-control"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <span>{summary}</span>
          <ChevronDown size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="hy-popover"
        style={{ padding: 6, minWidth: 220 }}
      >
        <button
          type="button"
          onClick={isAll ? (canClear ? onClearAll : undefined) : onSelectAll}
          style={{
            width: '100%',
            padding: '8px 10px',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            color: 'var(--hy-ink)',
            fontSize: 13,
            cursor: 'pointer',
            borderRadius: 6,
          }}
        >
          {isAll
            ? t('dashboard.filters.clearAll')
            : t('dashboard.filters.selectAll')}
        </button>
        <div style={{ height: 1, background: 'var(--hy-line)', margin: '4px 0' }} />
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {STATUS_ORDER.map((status) => {
            const checked = selected.has(status);
            const disabled = checked && selected.size <= 1;
            const color = STATUS_COLORS[status];
            return (
              <li key={status}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && onToggle(status)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--hy-ink)',
                    fontSize: 13,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    borderRadius: 6,
                    opacity: disabled ? 0.55 : 1,
                  }}
                >
                  <span
                    aria-checked={checked}
                    role="checkbox"
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: 5,
                      border: `1px solid ${checked ? color : 'var(--hy-line)'}`,
                      background: checked ? color : 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background .15s ease, border-color .15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {checked && (
                      <svg width={11} height={11} viewBox="0 0 12 12" aria-hidden>
                        <path
                          d="M2.5 6.2 L4.8 8.5 L9.5 3.5"
                          stroke="#1b2027"
                          strokeWidth={2}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 3,
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  {t(`dashboard.status.${status}`)}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
