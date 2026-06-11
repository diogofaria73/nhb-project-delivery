import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProjectStatus } from '@nhb-status-report/shared';
import { formatPctPtBr } from '../../lib/compute';
import { STATUS_COLORS, STATUS_ORDER, withAlpha } from './status-meta';

interface StatusDonutProps {
  counts: Record<ProjectStatus, number>;
  focus: ProjectStatus | null;
  onSelect: (status: ProjectStatus) => void;
}

const RADIUS = 62;
const STROKE = 22;
const CIRC = 2 * Math.PI * RADIUS;

export function StatusDonut({ counts, focus, onSelect }: StatusDonutProps) {
  const { t } = useTranslation();
  const [hover, setHover] = useState<ProjectStatus | null>(null);
  const visibleStatus = focus ?? hover;
  const total = STATUS_ORDER.reduce((sum, s) => sum + counts[s], 0);

  let offset = 0;
  const segments = STATUS_ORDER.filter((s) => counts[s] > 0).map((status) => {
    const count = counts[status];
    const fraction = total > 0 ? count / total : 0;
    const length = fraction * CIRC;
    const segment = {
      status,
      count,
      fraction,
      strokeDasharray: `${length} ${CIRC - length}`,
      strokeDashoffset: -offset,
      color: STATUS_COLORS[status],
    };
    offset += length;
    return segment;
  });

  const isFocused = (s: ProjectStatus) =>
    visibleStatus !== null && visibleStatus === s;
  const isDimmedByHover = (s: ProjectStatus) =>
    hover !== null && hover !== s;
  const isDimmedByFocus = (s: ProjectStatus) =>
    focus !== null && focus !== s;

  const centerCount = visibleStatus === null ? total : counts[visibleStatus];
  const centerLabel = visibleStatus === null
    ? t('dashboard.donut.centerLabel')
    : t(`dashboard.status.${visibleStatus}`).toUpperCase();
  const centerColor = visibleStatus === null
    ? 'var(--hy-ink)'
    : STATUS_COLORS[visibleStatus];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <svg
        viewBox="0 0 160 160"
        width={160}
        height={160}
        role="img"
        aria-label={`${total} projetos distribuídos por status`}
      >
        <g transform="rotate(-90 80 80)">
          {segments.map((seg, idx) => {
            const dimmed = isDimmedByHover(seg.status) || isDimmedByFocus(seg.status);
            const focused = isFocused(seg.status);
            return (
              <circle
                key={seg.status}
                cx={80}
                cy={80}
                r={RADIUS}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={focused ? STROKE + 5 : STROKE}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                opacity={dimmed ? (focus !== null ? 0.32 : 0.5) : 1}
                onMouseEnter={() => setHover(seg.status)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(seg.status)}
                className="hy-donut-sweep"
                style={{
                  cursor: 'pointer',
                  transition: 'opacity .18s ease, stroke-width .18s ease',
                  animationDelay: `${idx * 90}ms`,
                }}
              />
            );
          })}
        </g>
        <text
          x={80}
          y={76}
          textAnchor="middle"
          className="hy-display"
          style={{ fontSize: 34, fill: centerColor }}
        >
          {centerCount}
        </text>
        <text
          x={80}
          y={94}
          textAnchor="middle"
          style={{
            fontSize: 10,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            fill: visibleStatus === null ? 'var(--hy-ink-faint)' : centerColor,
          }}
        >
          {centerLabel}
        </text>
      </svg>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {STATUS_ORDER.filter((s) => counts[s] > 0).map((status) => {
          const count = counts[status];
          const pct = total > 0 ? (count / total) * 100 : 0;
          const focused = isFocused(status);
          return (
            <li key={status}>
              <button
                type="button"
                onMouseEnter={() => setHover(status)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(status)}
                style={{
                  width: '100%',
                  background: focused ? withAlpha(STATUS_COLORS[status], '24') : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 8px',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto auto',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  color: 'var(--hy-ink)',
                  textAlign: 'left',
                  opacity:
                    hover !== null && hover !== status
                      ? 0.55
                      : focus !== null && focus !== status
                        ? 0.55
                        : 1,
                  transition: 'opacity .18s ease, background .18s ease',
                }}
              >
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 3,
                    background: STATUS_COLORS[status],
                  }}
                />
                <span style={{ fontSize: 13 }}>{t(`dashboard.status.${status}`)}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{count}</span>
                <span style={{ fontSize: 12, color: 'var(--hy-ink-dim)' }}>
                  {formatPctPtBr(pct, 1)}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
