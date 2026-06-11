import { useTranslation } from 'react-i18next';
import type { ProjectStatus } from '@nhb-status-report/shared';
import { STATUS_COLORS, withAlpha } from './status-meta';

interface StatusPillProps {
  status: ProjectStatus;
  size?: 'sm' | 'md';
}

export function StatusPill({ status, size = 'md' }: StatusPillProps) {
  const { t } = useTranslation();
  const color = STATUS_COLORS[status];
  return (
    <span
      className="hy-pill"
      style={{
        background: withAlpha(color, '1f'),
        borderColor: withAlpha(color, '66'),
        color,
        fontSize: size === 'sm' ? 11 : 12,
        padding: size === 'sm' ? '2px 9px' : '4px 11px',
      }}
    >
      <span
        className="hy-pill-dot"
        style={{ background: color, width: size === 'sm' ? 6 : 7, height: size === 'sm' ? 6 : 7 }}
      />
      {t(`dashboard.status.${status}`)}
    </span>
  );
}
