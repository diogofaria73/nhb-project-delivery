import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandPanel() {
  const { t } = useTranslation();

  return (
    <div className="relative hidden overflow-hidden bg-slate-950 lg:flex">
      {/* Base ambient gradient — radial from upper-center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 35%, rgba(16,185,129,0.16), transparent 60%), radial-gradient(ellipse 80% 60% at 50% 80%, rgba(14,165,233,0.10), transparent 65%)',
        }}
      />

      {/* Concentric rings — echoes the Hydro waves, emanates from logo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 'min(1100px, 140%)',
          height: 'min(1100px, 140%)',
          background:
            'repeating-radial-gradient(circle at center, transparent 0, transparent 60px, rgba(255,255,255,0.03) 60px, rgba(255,255,255,0.03) 61px)',
          maskImage:
            'radial-gradient(circle at center, black 40%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(circle at center, black 40%, transparent 75%)',
        }}
      />

      {/* Hero halo directly behind the logo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[36%] h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/[0.18] blur-[110px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[36%] h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/[0.22] blur-[60px]"
      />

      {/* Dot grid — subtle texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Vignette — pushes attention to the center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(0,0,0,0.55)_100%)]"
      />

      {/* Content */}
      <div className="relative z-10 flex w-full flex-col items-center justify-between p-10 text-center xl:p-14">
        {/* Top: typographic eyebrow */}
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/45">
          {t('auth.brand.kicker')}
        </p>

        {/* Hero: logo with 3D perspective + wordmark */}
        <div className="flex flex-col items-center">
          <div
            className="relative"
            style={{ perspective: '900px' }}
          >
            {/* Outer ring */}
            <div
              aria-hidden
              className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-emerald-400/15 via-white/[0.04] to-transparent blur-md"
            />
            {/* Inner ring */}
            <div
              aria-hidden
              className="absolute inset-0 -m-2 rounded-full bg-gradient-to-br from-white/[0.08] to-transparent"
            />
            {/* Logo */}
            <div
              className={cn(
                'relative flex items-center justify-center rounded-[28px]',
                'h-[164px] w-[164px] xl:h-[180px] xl:w-[180px]',
              )}
              style={{
                transform: 'rotateX(8deg) rotateY(-14deg) rotateZ(1deg)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Reflective surface */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.18] via-white/[0.04] to-transparent ring-1 ring-white/15 backdrop-blur-sm"
              />
              {/* Top sheen */}
              <span
                aria-hidden
                className="absolute inset-x-3 top-3 h-1/3 rounded-2xl bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.35),_transparent_70%)]"
              />
              {/* Bottom shadow under logo */}
              <span
                aria-hidden
                className="absolute -bottom-6 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full bg-emerald-500/30 blur-2xl"
              />

              <img
                src="/app-logo.png"
                alt="NHB Hydro"
                className="relative h-[110px] w-[110px] object-contain [filter:brightness(0)_invert(1)_drop-shadow(0_8px_18px_rgba(255,255,255,0.18))_drop-shadow(0_0_28px_rgba(52,211,153,0.35))] xl:h-[120px] xl:w-[120px]"
              />
            </div>
          </div>

          {/* Tagline */}
          <h2 className="mt-12 max-w-md text-[22px] font-semibold leading-[1.2] tracking-tight text-white xl:text-[26px]">
            {t('auth.brand.titleLine1')}{' '}
            <span className="text-emerald-300/95">{t('auth.brand.titleLine2')}</span>
          </h2>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-white/60">
            {t('auth.brand.subtitle')}
          </p>

          {/* Features */}
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <Feature icon={TrendingUp} label={t('auth.brand.features.analytics')} />
            <Sep />
            <Feature icon={Target} label={t('auth.brand.features.goals')} />
            <Sep />
            <Feature icon={ShieldCheck} label={t('auth.brand.features.audit')} />
          </ul>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-white/40">
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
    <li className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/70">
      <Icon className="h-3.5 w-3.5 text-emerald-300" strokeWidth={2} />
      {label}
    </li>
  );
}

function Sep() {
  return <li aria-hidden className="h-3 w-px bg-white/15" />;
}
