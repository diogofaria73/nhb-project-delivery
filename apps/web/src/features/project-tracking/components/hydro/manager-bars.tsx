import { formatPctPtBr } from '../../lib/compute';

interface ManagerBarsProps {
  rows: Array<{ pm: string; percent: number; count: number }>;
}

const HEIGHT = 248;
const TOP_PAD = 26;
const BOTTOM_PAD = 44;

export function ManagerBars({ rows }: ManagerBarsProps) {
  const PLOT_H = HEIGHT - TOP_PAD - BOTTOM_PAD;

  if (rows.length === 0) {
    return (
      <div style={{ height: HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hy-ink-dim)', fontSize: 13 }}>
        Sem gerentes para mostrar
      </div>
    );
  }

  const barMaxWidth = 56;
  const count = rows.length;

  return (
    <div style={{ position: 'relative', height: HEIGHT, paddingLeft: 28 }}>
      <YAxis plotHeight={PLOT_H} topPad={TOP_PAD} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
          alignItems: 'end',
          height: PLOT_H + TOP_PAD,
          gap: 12,
        }}
      >
        {rows.map((row, idx) => {
          const barHeight = (Math.max(0, Math.min(100, row.percent)) / 100) * PLOT_H;
          return (
            <div
              key={row.pm}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                justifyContent: 'flex-end',
                height: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  lineHeight: 1.1,
                  gap: 1,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--hy-ink)' }}>
                  {formatPctPtBr(row.percent, 1)}%
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--hy-ink-faint)',
                    letterSpacing: '.02em',
                  }}
                >
                  {row.count} {row.count === 1 ? 'projeto' : 'projetos'}
                </span>
              </div>
              <div
                className="hy-bar-grow"
                style={{
                  width: '100%',
                  maxWidth: barMaxWidth,
                  height: barHeight,
                  background: 'var(--hy-teal)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height .25s ease',
                  animationDelay: `${idx * 60}ms`,
                }}
                title={`${row.pm}: ${formatPctPtBr(row.percent, 1)}%`}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
          gap: 12,
          marginTop: 8,
          position: 'absolute',
          bottom: 8,
          left: 28,
          right: 0,
        }}
      >
        {rows.map((row) => (
          <div
            key={row.pm}
            style={{
              fontSize: 12,
              color: 'var(--hy-ink-dim)',
              textAlign: 'center',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.2,
            }}
          >
            {row.pm}
          </div>
        ))}
      </div>
    </div>
  );
}

function YAxis({ plotHeight, topPad }: { plotHeight: number; topPad: number }) {
  const ticks = [
    { label: '100%', top: topPad },
    { label: '50%', top: topPad + plotHeight / 2 },
    { label: '0%', top: topPad + plotHeight },
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: plotHeight + topPad, pointerEvents: 'none' }}>
      {ticks.map((t) => (
        <div
          key={t.label}
          style={{
            position: 'absolute',
            top: t.top,
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 10, color: 'var(--hy-ink-faint)', width: 24, textAlign: 'right' }}>{t.label}</span>
          <span style={{ flex: 1, height: 1, background: 'var(--hy-gridline)' }} />
        </div>
      ))}
    </div>
  );
}
