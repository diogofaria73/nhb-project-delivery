import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatPctPtBr } from '../../lib/compute';
import { monthAxisForWeeks } from '../../lib/iso-week';

interface WeeklyBarsProps {
  stats: Array<{ sent: number; total: number; percent: number }>;
  selectedWeek: number;
  referenceYear: number;
}

const HEIGHT = 260;
const TOP_PAD = 30;
const LABELS_BAND = 22;
const MONTH_BAND = 24;
const Y_AXIS_W = 44;
const TARGET = 85;

export function WeeklyBars({ stats, selectedWeek, referenceYear }: WeeklyBarsProps) {
  const { t } = useTranslation();
  const n = stats.length;
  const monthsByWeek = useMemo(
    () => monthAxisForWeeks(referenceYear, n),
    [referenceYear, n],
  );

  if (n === 0) {
    return (
      <div
        style={{
          height: HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--hy-ink-dim)',
          fontSize: 13,
        }}
      >
        Sem dados para o intervalo selecionado
      </div>
    );
  }

  const plotH = HEIGHT - TOP_PAD - LABELS_BAND - MONTH_BAND;
  // Adaptive widths/gaps for the bars.
  const gap = n <= 16 ? 4 : n <= 26 ? 3 : n <= 40 ? 2 : 1;
  const maxBarW = n <= 16 ? 30 : n <= 26 ? 26 : n <= 40 ? 22 : 18;
  // Adaptive label step.
  const labelStep = n <= 16 ? 1 : n <= 26 ? 2 : n <= 40 ? 4 : 5;

  // Group consecutive weeks by month for the month band.
  const monthGroups: Array<{ monthIdx: number; startWeek: number; endWeek: number }> = [];
  for (let w = 1; w <= n; w++) {
    const month = monthsByWeek[w - 1] ?? 0;
    const last = monthGroups[monthGroups.length - 1];
    if (last && last.monthIdx === month) {
      last.endWeek = w;
    } else {
      monthGroups.push({ monthIdx: month, startWeek: w, endWeek: w });
    }
  }

  const ticks = [
    { value: 100, top: TOP_PAD + ((100 - 100) / 100) * plotH },
    { value: 50, top: TOP_PAD + ((100 - 50) / 100) * plotH },
    { value: 0, top: TOP_PAD + ((100 - 0) / 100) * plotH },
  ];

  const targetTop = TOP_PAD + ((100 - TARGET) / 100) * plotH;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${Y_AXIS_W}px 1fr`,
        gap: 6,
        height: HEIGHT,
      }}
    >
      {/* Y axis labels — right-aligned column */}
      <div style={{ position: 'relative' }}>
        {ticks.map((tick) => (
          <span
            key={tick.value}
            style={{
              position: 'absolute',
              top: tick.top,
              right: 0,
              transform: 'translateY(-50%)',
              fontSize: 10,
              color: 'var(--hy-ink-faint)',
              letterSpacing: '.02em',
            }}
          >
            {tick.value}%
          </span>
        ))}
        <span
          style={{
            position: 'absolute',
            top: targetTop,
            right: 0,
            transform: 'translateY(-50%)',
            fontSize: 9.5,
            color: 'var(--hy-taupe)',
            letterSpacing: '.04em',
            fontWeight: 600,
          }}
          aria-hidden
        >
          85%
        </span>
      </div>

      {/* Plot column — gridlines, target line, bars, week labels, month band */}
      <div style={{ position: 'relative' }}>
        {/* Gridlines */}
        {ticks.map((tick) => (
          <span
            key={tick.value}
            style={{
              position: 'absolute',
              top: tick.top,
              left: 0,
              right: 0,
              height: 1,
              background: 'var(--hy-gridline)',
            }}
            aria-hidden
          />
        ))}
        {/* Target line (dashed) */}
        <span
          style={{
            position: 'absolute',
            top: targetTop,
            left: 0,
            right: 0,
            height: 0,
            borderTop: '1px dashed var(--hy-taupe)',
            opacity: 0.7,
          }}
          aria-hidden
        />

        {/* Bars */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
            alignItems: 'end',
            height: plotH + TOP_PAD,
            gap,
          }}
        >
          {stats.map((s, idx) => {
            const w = idx + 1;
            const isSelected = w === selectedWeek;
            const barH = (Math.max(0, Math.min(100, s.percent)) / 100) * plotH;
            return (
              <div
                key={w}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                  position: 'relative',
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0,
                      lineHeight: 1.05,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--hy-teal-bright)',
                        fontWeight: 700,
                      }}
                    >
                      {formatPctPtBr(s.percent, 0)}%
                    </span>
                    <span
                      style={{
                        fontSize: 9.5,
                        color: 'var(--hy-ink-faint)',
                        fontWeight: 500,
                      }}
                    >
                      {s.sent}/{s.total}
                    </span>
                  </div>
                )}
                <div
                  title={t('dashboard.weekly.tooltip', {
                    w,
                    month: t(`dashboard.monthsShort.${monthsByWeek[idx]}`),
                    pct: formatPctPtBr(s.percent, 0),
                    sent: s.sent,
                    total: s.total,
                  })}
                  className="hy-bar-grow"
                  style={{
                    width: '100%',
                    maxWidth: maxBarW,
                    height: barH,
                    background: isSelected
                      ? 'var(--hy-teal-bright)'
                      : 'var(--hy-bar-muted)',
                    borderRadius: '3px 3px 0 0',
                    transition: 'height .25s ease',
                    animationDelay: `${idx * 14}ms`,
                    animationDuration: '0.5s',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Week numbers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
            gap,
            marginTop: 4,
            height: LABELS_BAND,
          }}
        >
          {stats.map((_, idx) => {
            const w = idx + 1;
            const isSelected = w === selectedWeek;
            const shouldShow = isSelected || w % labelStep === 0 || w === 1;
            return (
              <div
                key={w}
                style={{
                  fontSize: 10,
                  color: isSelected ? 'var(--hy-ink)' : 'var(--hy-ink-faint)',
                  fontWeight: isSelected ? 700 : 400,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {shouldShow ? w : ''}
              </div>
            );
          })}
        </div>

        {/* Month band */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
            gap,
            height: MONTH_BAND,
            paddingTop: 4,
            borderTop: '1px solid var(--hy-line)',
          }}
        >
          {monthGroups.map((group, gi) => (
            <div
              key={`${group.monthIdx}-${gi}`}
              style={{
                gridColumn: `${group.startWeek} / ${group.endWeek + 1}`,
                borderLeft: gi === 0 ? 'none' : '1px solid var(--hy-line)',
                fontSize: 10.5,
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                color: 'var(--hy-ink-dim)',
                textAlign: 'center',
                paddingTop: 4,
                fontWeight: 600,
              }}
            >
              {t(`dashboard.monthsShort.${group.monthIdx}`)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
