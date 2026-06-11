import { useTranslation } from 'react-i18next';
import { ShieldCheck, Target, TrendingUp } from 'lucide-react';

export function BrandPanel() {
  const { t } = useTranslation();

  return (
    <div
      className="relative hidden overflow-hidden lg:flex"
      style={{
        background:
          'var(--hy-bg) radial-gradient(ellipse 90% 70% at 50% 35%, rgba(98, 179, 168, 0.16), transparent 60%), radial-gradient(ellipse 80% 60% at 50% 80%, rgba(197, 185, 172, 0.08), transparent 65%)',
      }}
    >
      {/* Concentric rings — echoes the Hydro waves */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 'min(1100px, 140%)',
          height: 'min(1100px, 140%)',
          background:
            'repeating-radial-gradient(circle at center, transparent 0, transparent 60px, rgba(236, 234, 228, 0.03) 60px, rgba(236, 234, 228, 0.03) 61px)',
          maskImage:
            'radial-gradient(circle at center, black 40%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(circle at center, black 40%, transparent 75%)',
        }}
      />

      {/* Hero halo behind the wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          height: 440,
          width: 440,
          background: 'rgba(98, 179, 168, 0.18)',
          filter: 'blur(110px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          height: 240,
          width: 240,
          background: 'rgba(98, 179, 168, 0.22)',
          filter: 'blur(60px)',
        }}
      />

      {/* Dot grid — subtle texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.04,
          backgroundImage:
            'radial-gradient(circle at center, var(--hy-ink) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.55) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex w-full flex-col items-center justify-between p-10 text-center xl:p-14">
        {/* Top: typographic eyebrow */}
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '.32em',
            color: 'rgba(236, 234, 228, 0.45)',
          }}
        >
          {t('auth.brand.kicker')}
        </p>

        {/* Hero wordmark — pure typography, no logo image */}
        <div className="flex flex-col items-center">
          <h1
            className="hy-display"
            style={{
              fontSize: 72,
              letterSpacing: '.22em',
              color: 'var(--hy-ink)',
              lineHeight: 1,
              textShadow: '0 6px 32px rgba(98, 179, 168, 0.35)',
              marginBottom: 14,
            }}
          >
            HYDRO
          </h1>
          <p
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '.42em',
              color: 'var(--hy-teal-bright)',
              fontWeight: 600,
            }}
          >
            Status Report
          </p>

          {/* Tagline */}
          <h2
            className="hy-display"
            style={{
              fontSize: 26,
              fontWeight: 400,
              lineHeight: 1.15,
              color: 'var(--hy-ink)',
              maxWidth: 380,
              marginTop: 48,
              letterSpacing: '-0.01em',
            }}
          >
            {t('auth.brand.titleLine1')}{' '}
            <span style={{ color: 'var(--hy-teal-bright)' }}>
              {t('auth.brand.titleLine2')}
            </span>
          </h2>
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.55,
              color: 'var(--hy-ink-dim)',
              maxWidth: 340,
              marginTop: 14,
            }}
          >
            {t('auth.brand.subtitle')}
          </p>

          {/* Feature row */}
          <ul
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 22,
              marginTop: 36,
              listStyle: 'none',
              padding: 0,
            }}
          >
            <Feature
              icon={TrendingUp}
              label={t('auth.brand.features.analytics')}
            />
            <Sep />
            <Feature icon={Target} label={t('auth.brand.features.goals')} />
            <Sep />
            <Feature
              icon={ShieldCheck}
              label={t('auth.brand.features.audit')}
            />
          </ul>
        </div>

        {/* Footer */}
        <p
          style={{
            fontSize: 11,
            color: 'rgba(236, 234, 228, 0.4)',
            letterSpacing: '.04em',
          }}
        >
          {t('auth.hero.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <li
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11,
        fontWeight: 500,
        color: 'rgba(236, 234, 228, 0.7)',
        letterSpacing: '.02em',
      }}
    >
      <Icon size={14} strokeWidth={1.8} color="var(--hy-teal-bright)" />
      {label}
    </li>
  );
}

function Sep() {
  return (
    <li
      aria-hidden
      style={{
        height: 12,
        width: 1,
        background: 'rgba(236, 234, 228, 0.15)',
        listStyle: 'none',
      }}
    />
  );
}
