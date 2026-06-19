import { useTranslation } from 'react-i18next';
import { formatPctPtBr } from '../../lib/compute';
import { useAnimatedNumber } from '../../hooks/use-animated-number';

interface BulletKpiProps {
  label: string;
  hint: string;
  value: number; // 0..100
  target?: number;
  info?: React.ReactNode;
}

const TARGET_DEFAULT = 85;

export function BulletKpi({
  label,
  hint,
  value,
  target = TARGET_DEFAULT,
  info,
}: BulletKpiProps) {
  const { t } = useTranslation();
  const animatedValue = useAnimatedNumber(value, 750);
  const onTarget = value >= target;
  const ppBelow = Math.max(0, Math.round(target - value));
  const flagBg = onTarget
    ? 'rgba(98,179,168,.14)'
    : 'rgba(197,185,172,.12)';
  const flagBorder = onTarget
    ? 'rgba(98,179,168,.4)'
    : 'rgba(197,185,172,.4)';
  const flagColor = onTarget ? '#62b3a8' : '#c5b9ac';
  const flagLabel = onTarget
    ? t('dashboard.kpis.onTarget')
    : t('dashboard.kpis.belowTarget', { pp: ppBelow });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--hy-ink)',
              textTransform: 'uppercase',
              letterSpacing: '.12em',
            }}
          >
            <span>{label}</span>
            {info}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--hy-ink-faint)',
              marginTop: 4,
              letterSpacing: '.02em',
            }}
          >
            {hint}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 2,
          }}
        >
          <span style={{ fontSize: 16, color: '#c5b9ac', fontWeight: 600 }}>
            {target}%
          </span>
          <span
            style={{
              fontSize: 9.5,
              textTransform: 'uppercase',
              letterSpacing: '.14em',
              color: 'var(--hy-ink-faint)',
            }}
          >
            {t('dashboard.kpis.target')}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
          paddingTop: 4,
        }}
      >
        <span
          className="hy-display"
          style={{
            fontSize: 56,
            lineHeight: 0.92,
            color: 'var(--hy-ink)',
            letterSpacing: '-0.02em',
          }}
        >
          {formatPctPtBr(animatedValue, 1)}
        </span>
        <span
          style={{
            fontSize: 24,
            color: '#62b3a8',
            fontWeight: 500,
            paddingBottom: 6,
            letterSpacing: '-0.01em',
          }}
        >
          %
        </span>
        <span
          style={{
            marginLeft: 'auto',
            marginBottom: 6,
            background: flagBg,
            border: `1px solid ${flagBorder}`,
            color: flagColor,
            padding: '5px 12px',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '.02em',
          }}
        >
          {flagLabel}
        </span>
      </div>

      <Bullet value={animatedValue} target={target} />
    </div>
  );
}

function Bullet({ value, target }: { value: number; target: number }) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const clampedTarget = Math.max(0, Math.min(100, target));
  return (
    <div>
      <div
        style={{
          position: 'relative',
          height: 18,
          borderRadius: 5,
          overflow: 'hidden',
          background:
            'linear-gradient(to right, var(--hy-track) 0%, var(--hy-track) 50%, var(--hy-track-mid) 50%, var(--hy-track-mid) 85%, var(--hy-track-high) 85%, var(--hy-track-high) 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            height: 8,
            width: `${clampedValue}%`,
            borderRadius: 3,
            background:
              'linear-gradient(to right, rgba(98,179,168,.55), rgba(98,179,168,1))',
            boxShadow: '0 0 12px rgba(98, 179, 168, 0.35)',
            transition: 'width .35s cubic-bezier(.2,.7,.3,1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${clampedTarget}%`,
            top: -3,
            width: 3,
            height: 24,
            background: 'var(--hy-marker)',
            transform: 'translateX(-50%)',
            borderRadius: 2,
          }}
          aria-hidden
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 10,
          color: 'var(--hy-ink-faint)',
          letterSpacing: '.05em',
        }}
      >
        <span>0</span>
        <span>50</span>
        <span>100%</span>
      </div>
    </div>
  );
}
